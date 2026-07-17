import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyQuoteConfirmToken } from "@/lib/tokens";
import { depositFor, DEPOSIT_PERCENTAGE } from "@/lib/deposit";

export const runtime = "nodejs";

/** Quote links stay valid for 30 days. */
const TOKEN_EXPIRY_HOURS = 24 * 30;

/**
 * POST /api/quote/details
 * Returns the stored instant quote for a booking so the customer-facing quote
 * page can render it. Public (no login) — authorised by the signed token.
 */
export async function POST(req: NextRequest) {
  try {
    const { bookingId, token } = await req.json();
    if (!bookingId || !token) {
      return NextResponse.json({ success: false, error: "Missing booking or token" }, { status: 400 });
    }
    if (!verifyQuoteConfirmToken(bookingId, token, TOKEN_EXPIRY_HOURS)) {
      return NextResponse.json({ success: false, error: "This quote link is invalid or has expired." }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        reference, service_type, status, quote_line_items, quote_total,
        deposit_amount, deposit_status, move_date,
        customer:customers!inner(full_name)
      `)
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
    const firstName = (customer?.full_name ?? "there").split(" ")[0];
    const lines = Array.isArray(booking.quote_line_items) ? booking.quote_line_items : [];
    const total = Number(booking.quote_total) || 0;

    return NextResponse.json({
      success: true,
      reference: booking.reference,
      serviceType: booking.service_type,
      firstName,
      status: booking.status,
      lines,
      total,
      deposit: booking.deposit_amount != null ? Number(booking.deposit_amount) : depositFor(total),
      depositPercentage: DEPOSIT_PERCENTAGE,
      depositStatus: booking.deposit_status ?? "unpaid",
      // A quote we couldn't compute (e.g. missing bedrooms) has no lines — let
      // the page show a graceful "we'll be in touch" instead of an empty quote.
      hasQuote: lines.length > 0 && total > 0,
    });
  } catch (err) {
    console.error("quote/details error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
