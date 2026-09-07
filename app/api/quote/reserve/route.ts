import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyQuoteConfirmToken } from "@/lib/tokens";
import { depositFor } from "@/lib/deposit";
import { sendDepositMessages } from "@/lib/bookings/quoteDelivery";
import { loadPricing } from "@/lib/pricing";

export const runtime = "nodejs";

const TOKEN_EXPIRY_HOURS = 24 * 30;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * POST /api/quote/reserve
 * Customer reserves their date. Recomputes the total SERVER-SIDE from the stored
 * line items minus any removed removable lines (never trusting a client total),
 * persists it, moves the booking to `deposit_invoice_sent` (the deposit request
 * is now sent), and sends the deposit details by email + SMS + WhatsApp.
 */
export async function POST(req: NextRequest) {
  try {
    const { bookingId, token, removedKeys, tier } = await req.json();
    if (!bookingId || !token) {
      return NextResponse.json({ success: false, error: "Missing booking or token" }, { status: 400 });
    }
    if (!verifyQuoteConfirmToken(bookingId, token, TOKEN_EXPIRY_HOURS)) {
      return NextResponse.json({ success: false, error: "This quote link is invalid or has expired." }, { status: 401 });
    }

    const removed: string[] = Array.isArray(removedKeys) ? removedKeys : [];
    const supabase = createAdminClient();

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("status, reference, quote_line_items, customer:customers!inner(full_name, email, phone)")
      .eq("id", bookingId)
      .single();
    if (error || !booking) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    const allLines = Array.isArray(booking.quote_line_items) ? booking.quote_line_items : [];
    // Drop only removable lines the customer removed; base (and any non-removable
    // line) always stays.
    const keptLines = allLines.filter(
      (l: { key?: string; removable?: boolean }) =>
        !(l.removable && l.key && removed.includes(l.key))
    );
    const standardTotal = round2(
      keptLines.reduce((sum: number, l: { total?: number }) => sum + (Number(l.total) || 0), 0)
    );

    // Tier choice: Premium switches the quote to a fixed multiple of Standard and
    // bundles in the done-for-you services (packing/materials/dismantle/reassemble).
    const isPremium = tier === "premium";
    const { config: pricingCfg } = await loadPricing(supabase);
    const total = isPremium ? round2(standardTotal * pricingCfg.premium_multiplier) : standardTotal;
    const finalLines = isPremium
      ? [{ key: "premium", description: "Premium — Full Pack & Move (packing, materials, dismantle & reassemble)", quantity: 1, unit_price: total, total, removable: false }]
      : keptLines;
    const deposit = depositFor(total);

    // Reserving sends the deposit request → move to "Deposit Invoice Sent". Core
    // columns first so the reserve always persists.
    const { error: updErr } = await supabase
      .from("bookings")
      .update({
        quote_line_items: finalLines,
        quote_subtotal: total,
        quote_total: total,
        quote_tier: isPremium ? "premium" : "standard",
        status: "deposit_invoice_sent",
      })
      .eq("id", bookingId);
    if (updErr) {
      return NextResponse.json({ success: false, error: "Couldn't reserve your date. Please try again." }, { status: 500 });
    }
    try {
      await supabase.from("bookings").update({ deposit_amount: deposit }).eq("id", bookingId);
    } catch { /* deposit_amount column may not be migrated yet */ }

    // Premium includes the done-for-you services — record them on the booking.
    if (isPremium) {
      try {
        const services = { packing_services: true, packing_materials: true, disassemble_furniture: true, assemble_furniture: true };
        const { data: existingSvc } = await supabase.from("additional_services").select("id").eq("booking_id", bookingId).maybeSingle();
        if (existingSvc) await supabase.from("additional_services").update(services).eq("booking_id", bookingId);
        else await supabase.from("additional_services").insert({ booking_id: bookingId, ...services });
      } catch { /* best-effort — never block the reserve */ }
    }

    // Audit trail (best-effort).
    await Promise.allSettled([
      supabase.from("status_history").insert({
        booking_id: bookingId,
        previous_status: booking.status,
        new_status: "deposit_invoice_sent",
        changed_by: "customer",
      }),
      supabase.from("activity_log").insert({
        booking_id: bookingId,
        action: `Customer reserved their date (${isPremium ? "Premium" : "Standard"}) — deposit invoice sent`,
        metadata: { tier: isPremium ? "premium" : "standard", total, deposit, removed_lines: removed },
        performed_by: "customer",
      }),
    ]);

    // Send the deposit details across all channels (best-effort, never blocks).
    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
    if (customer) {
      await sendDepositMessages({
        bookingId,
        token,
        reference: booking.reference as string,
        firstName: (customer.full_name ?? "there").split(" ")[0],
        email: customer.email,
        phone: customer.phone,
        deposit,
      });
    }

    return NextResponse.json({ success: true, total, deposit });
  } catch (err) {
    console.error("quote/reserve error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
