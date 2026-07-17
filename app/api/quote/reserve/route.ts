import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyQuoteConfirmToken } from "@/lib/tokens";
import { depositFor } from "@/lib/deposit";

export const runtime = "nodejs";

const TOKEN_EXPIRY_HOURS = 24 * 30;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * POST /api/quote/reserve
 * Customer confirms their (possibly edited) quote. Recomputes the total
 * SERVER-SIDE from the stored line items minus any removed removable lines
 * (never trusting a client total), persists it, and moves the booking to
 * `quote_confirmed`. Idempotent-ish: re-reserving just re-confirms.
 */
export async function POST(req: NextRequest) {
  try {
    const { bookingId, token, removedKeys } = await req.json();
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
      .select("status, quote_line_items")
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
    const total = round2(
      keptLines.reduce((sum: number, l: { total?: number }) => sum + (Number(l.total) || 0), 0)
    );
    const deposit = depositFor(total);

    // Best-effort deposit_amount (new column). Core columns first so the confirm
    // always persists.
    const { error: updErr } = await supabase
      .from("bookings")
      .update({
        quote_line_items: keptLines,
        quote_subtotal: total,
        quote_total: total,
        status: "quote_confirmed",
      })
      .eq("id", bookingId);
    if (updErr) {
      return NextResponse.json({ success: false, error: "Couldn't reserve your date. Please try again." }, { status: 500 });
    }
    try {
      await supabase.from("bookings").update({ deposit_amount: deposit }).eq("id", bookingId);
    } catch { /* deposit_amount column may not be migrated yet */ }

    // Audit trail (best-effort).
    await Promise.allSettled([
      supabase.from("status_history").insert({
        booking_id: bookingId,
        previous_status: booking.status,
        new_status: "quote_confirmed",
        changed_by: "customer",
      }),
      supabase.from("activity_log").insert({
        booking_id: bookingId,
        action: "quote_confirmed",
        metadata: { total, deposit, removed_lines: removed },
        performed_by: "customer",
      }),
    ]);

    return NextResponse.json({ success: true, total, deposit });
  } catch (err) {
    console.error("quote/reserve error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
