import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyQuoteConfirmToken } from "@/lib/tokens";
import { depositFor, DEPOSIT_PERCENTAGE } from "@/lib/deposit";
import { crewSummary, vanSizeLabel } from "@/lib/crew";
import { loadPricing } from "@/lib/pricing";

export const runtime = "nodejs";

/** Quote links stay valid for 30 days. */
const TOKEN_EXPIRY_HOURS = 24 * 30;

/** Statuses reached only after the customer has reserved — `deposit_amount` is
 * a real invoiced figure from that point on, not the original creation-time
 * estimate. */
const RESERVED_STATUSES = new Set([
  "deposit_invoice_sent",
  "deposit_paid_job_confirmed",
  "full_invoice_sent",
  "full_balance_paid",
  "job_completed",
]);

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
        reference, service_type, status, quote_line_items, quote_total, quote_premium_total,
        show_premium_quote, deposit_percentage,
        deposit_amount, deposit_status, move_date, inventory, has_white_goods,
        quote_crew_men, quote_crew_blurb, quote_van_size, quote_van_count,
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
    // An admin-set Premium price (e.g. "fill it for them") wins over the auto
    // multiplier, so the customer sees exactly the figure that was agreed.
    const premiumTotal = booking.quote_premium_total != null
      ? Number(booking.quote_premium_total)
      : Math.round(total * pricingCfg.premium_multiplier * 100) / 100;

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
    // An admin-set crew size (quote_crew_men — always set for a non-Removals
    // quote built in the generic Quote Builder, which has no Standard/Premium
    // auto-sizing) wins over the tier-computed default.
    const menOverride = booking.quote_crew_men != null ? Number(booking.quote_crew_men) : null;
    const crew = {
      men: menOverride ?? std.men,
      vanCount: std.vans,
      line: menOverride != null
        ? `${menOverride} professional movers · ${std.vans} × ${std.vehicle}`
        : std.line,
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
      premiumTotal,
      premiumMultiplier: pricingCfg.premium_multiplier,
      showPremiumQuote: booking.show_premium_quote !== false,
      // This booking's own rate (stamped at creation) — never the current
      // site-wide default, so a later rate change can't move an existing
      // booking's deposit.
      depositPercentage: Number(booking.deposit_percentage) || DEPOSIT_PERCENTAGE,
      // Before the customer has reserved (deposit invoiced), there is no real
      // "invoiced" deposit yet — always show this booking's rate applied to the
      // CURRENT quote_total so an admin's price edit is reflected immediately.
      // Once a deposit has actually been invoiced (reserve locks in
      // `deposit_amount` from that moment's quote_total), that stored figure is
      // the one already promised/charged.
      deposit: RESERVED_STATUSES.has(booking.status as string) && booking.deposit_amount != null
        ? Number(booking.deposit_amount)
        : depositFor(total, Number(booking.deposit_percentage) || undefined),
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
