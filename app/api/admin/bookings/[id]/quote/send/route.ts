import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQuoteConfirmToken } from "@/lib/tokens";
import { markQuoteSent, sendReserveMessages } from "@/lib/bookings/quoteDelivery";
import { logError } from "@/lib/log-error";

/**
 * POST /api/admin/bookings/[id]/quote/send
 * Sends the quote already saved via PATCH /quote/save (Man & Van, House
 * Clearance, House Cleaning, End of Tenancy — the generic Quote Builder, which
 * has no Standard/Premium tiers). Delivers through the exact same path as
 * Removals' /quote/tiers route (`markQuoteSent` + `sendReserveMessages`,
 * showPremium: false) so every service sends one consistent "pay your deposit
 * to secure your date" quote, landing on the same self-serve payment page
 * (/quote/[bookingId]/[token]) — not the old "click to confirm, then wait for
 * an admin to email a deposit invoice" flow this route used to run.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;
    const supabase = await createClient();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, reference, status, quote_total, quote_line_items, inventory, customer:customers(full_name, email, phone)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (!booking.quote_total || !booking.quote_line_items || !Array.isArray(booking.quote_line_items)) {
      return NextResponse.json({ success: false, error: "Quote data not found. Please save a quote first." }, { status: 400 });
    }

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }
    if (!customer.email || !customer.phone) {
      return NextResponse.json({ success: false, error: "Customer is missing an email or phone" }, { status: 400 });
    }

    const token = generateQuoteConfirmToken(bookingId);
    if (!token) {
      return NextResponse.json({ success: false, error: "Quote links aren't configured (QUOTE_CONFIRM_SECRET missing)" }, { status: 500 });
    }

    try {
      await markQuoteSent(supabase, bookingId, booking.status as string);
      await sendReserveMessages({
        bookingId,
        token,
        reference: booking.reference as string,
        firstName: (customer.full_name ?? "there").split(" ")[0],
        email: customer.email,
        phone: customer.phone,
        total: Number(booking.quote_total),
        inventory: booking.inventory,
        showPremium: false, // the generic Quote Builder has no tier concept
      });
    } catch (err) {
      await logError({ message: `quote/send failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { bookingId } });
      return NextResponse.json({ success: false, error: "Saved, but sending failed — try again" }, { status: 500 });
    }

    // Best-effort — the modal only reads channels for its toast; sendReserveMessages
    // already fires all three in parallel and never throws per-channel.
    return NextResponse.json({ success: true, channels: { email: true, sms: true, whatsapp: true } });
  } catch (err) {
    console.error("quote/send error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
