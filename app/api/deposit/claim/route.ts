import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyQuoteConfirmToken } from "@/lib/tokens";
import { sendEmail, resendAdminEmails } from "@/lib/resend";
import { sendSMS } from "@/lib/twilio";

export const runtime = "nodejs";

const TOKEN_EXPIRY_HOURS = 24 * 30;

/**
 * POST /api/deposit/claim
 * The customer declares they've made the bank transfer ("I've made payment").
 * We record the claim (pending team verification of the actual transfer) and
 * alert the team. We never auto-mark it paid — a human confirms the money landed.
 */
export async function POST(req: NextRequest) {
  try {
    const { bookingId, token } = await req.json();
    if (!bookingId || !token) {
      return NextResponse.json({ success: false, error: "Missing booking or token" }, { status: 400 });
    }
    if (!verifyQuoteConfirmToken(bookingId, token, TOKEN_EXPIRY_HOURS)) {
      return NextResponse.json({ success: false, error: "This link is invalid or has expired." }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("reference, quote_total, deposit_amount, customer:customers!inner(full_name, phone)")
      .eq("id", bookingId)
      .single();
    if (error || !booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;

    // Record the claim (best-effort — deposit_status/claimed_at are new columns).
    try {
      await supabase
        .from("bookings")
        .update({ deposit_status: "claimed", deposit_claimed_at: new Date().toISOString() })
        .eq("id", bookingId);
    } catch { /* columns may not be migrated yet */ }

    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "deposit_claimed",
      metadata: { reference: booking.reference, deposit_amount: booking.deposit_amount ?? null },
      performed_by: "customer",
    });

    // Alert the team to verify the transfer (best-effort, never blocks the reply).
    const amount = booking.deposit_amount != null ? `£${Number(booking.deposit_amount).toFixed(2)}` : "the deposit";
    await Promise.allSettled([
      sendEmail({
        to: resendAdminEmails,
        subject: `💷 Deposit claimed — verify transfer (${booking.reference})`,
        html: `<p><strong>${customer?.full_name ?? "A customer"}</strong> says they've paid ${amount} for booking <strong>${booking.reference}</strong>.</p><p>Please check the bank account and confirm the transfer, then mark the deposit verified.</p>`,
      }),
      process.env.NEXT_PUBLIC_ADMIN_PHONE
        ? sendSMS(
            process.env.NEXT_PUBLIC_ADMIN_PHONE,
            `Deposit claimed: ${customer?.full_name ?? "Customer"} paid ${amount} for ${booking.reference}. Verify the bank transfer.`
          )
        : Promise.resolve(),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("deposit/claim error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
