import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendDepositConfirmedMessages } from "@/lib/bookings/quoteDelivery";

export const runtime = "nodejs";

/**
 * POST /api/admin/bookings/[id]/confirm-deposit
 * Admin verifies the deposit bank transfer landed. Moves the booking to
 * "Job Confirmed", marks the deposit verified, and notifies the customer that
 * Ample Removals has confirmed their deposit (email + SMS + WhatsApp).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const bookingId = params.id;
  const supabase = createAdminClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("status, reference, customer:customers!inner(full_name, email, phone)")
    .eq("id", bookingId)
    .single();
  if (error || !booking) {
    return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
  }
  const previousStatus = booking.status as string;

  // Core status change first so it always lands.
  const { error: updErr } = await supabase
    .from("bookings")
    .update({ status: "deposit_paid_job_confirmed" })
    .eq("id", bookingId);
  if (updErr) {
    return NextResponse.json({ success: false, error: "Couldn't confirm the deposit." }, { status: 500 });
  }
  // Mark the deposit verified (new column — best-effort).
  try {
    await supabase.from("bookings").update({ deposit_status: "verified" }).eq("id", bookingId);
  } catch { /* deposit_status column may not be migrated yet */ }

  await Promise.allSettled([
    supabase.from("status_history").insert({
      booking_id: bookingId,
      previous_status: previousStatus,
      new_status: "deposit_paid_job_confirmed",
      changed_by: "admin",
    }),
    supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Deposit confirmed by admin",
      metadata: { reference: booking.reference },
      performed_by: "admin",
    }),
  ]);

  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  if (customer) {
    await sendDepositConfirmedMessages({
      reference: booking.reference as string,
      firstName: (customer.full_name ?? "there").split(" ")[0],
      email: customer.email,
      phone: customer.phone,
    });
  }

  return NextResponse.json({ success: true });
}
