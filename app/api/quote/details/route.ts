import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyQuoteConfirmToken } from "@/lib/tokens";
import { depositFor, DEPOSIT_PERCENTAGE } from "@/lib/deposit";
import { crewSummary, vanSizeLabel } from "@/lib/crew";
import { loadPricing } from "@/lib/pricing";

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
        deposit_amount, deposit_status, move_date, inventory, has_white_goods,
        quote_crew_blurb, quote_van_size, quote_van_count,
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
    const { config: pricingCfg } = await loadPricing(supabase);

    // Team & vehicle — tier-aware, derived from the move size. Standard = 2 movers
    // (7 yrs); Premium = 4 movers (11 yrs). Vans follow the item-count rule. The
    // customer is never shown a tonnage — always "Lorry or Luton van".
    const inv = Array.isArray(booking.inventory) ? booking.inventory : [];
    const itemQty = inv.reduce((n: number, i: { quantity?: number }) => n + (Number(i?.quantity) || 0), 0);
    const hasWG = Boolean(booking.has_white_goods);
    // Admin can turn the automatic 2-van sizing on/off in Settings.
    const { data: settings } = await supabase.from("settings").select("auto_van_count").eq("id", 1).maybeSingle();
    const autoVans = settings?.auto_van_count !== false;
    // Admin per-booking overrides (vehicle changed to Lorry / extra vans added).
    const vehicle = booking.quote_van_size ? vanSizeLabel(booking.quote_van_size) : undefined;
    const vans = booking.quote_van_count != null ? Number(booking.quote_van_count) : undefined;
    const std = crewSummary("standard", itemQty, hasWG, { autoVans, vehicle, vans });
    const prem = crewSummary("premium", itemQty, hasWG, { autoVans, vehicle, vans });
    const crew = {
      men: std.men,
      vanCount: std.vans,
      line: std.line,
      blurb: booking.quote_crew_blurb || std.blurb,
    };

    return NextResponse.json({
      success: true,
      reference: booking.reference,
      serviceType: booking.service_type,
      firstName,
      status: booking.status,
      lines,
      total,
      crew,
      premiumCrewLine: prem.line,
      premiumMultiplier: pricingCfg.premium_multiplier,
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
