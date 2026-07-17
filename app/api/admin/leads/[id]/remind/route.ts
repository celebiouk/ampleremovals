import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { generateQuoteConfirmToken } from "@/lib/tokens";
import { sendLeadInvite } from "@/lib/lead-invite";

export const runtime = "nodejs";

/**
 * POST /api/admin/leads/[id]/remind
 * Admin manually re-sends the completion reminder (email + SMS + WhatsApp) to a
 * pending lead — e.g. after the 5-day auto ladder has stopped.
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
    .select("id, is_partial_lead, customer:customers!inner(full_name, email, phone)")
    .eq("id", bookingId)
    .single();
  if (error || !booking) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }
  if (!booking.is_partial_lead) {
    return NextResponse.json({ success: false, error: "This lead has already been completed." }, { status: 400 });
  }

  const token = generateQuoteConfirmToken(bookingId);
  if (!token) {
    return NextResponse.json({ success: false, error: "Couldn't sign the reminder link." }, { status: 500 });
  }
  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  const link = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/complete/${bookingId}/${token}`;

  await sendLeadInvite({
    firstName: (customer?.full_name ?? "there").split(" ")[0],
    email: customer!.email,
    phone: customer!.phone,
    link,
    reminder: true,
  });

  await supabase.from("bookings").update({ lead_last_reminder_at: new Date().toISOString() }).eq("id", bookingId);
  await supabase.from("activity_log").insert({
    booking_id: bookingId,
    action: "Lead reminder sent (manual)",
    metadata: {},
    performed_by: "admin",
  });

  return NextResponse.json({ success: true });
}
