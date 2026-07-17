import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyQuoteConfirmToken } from "@/lib/tokens";
import { depositFor } from "@/lib/deposit";
import { sendDepositMessages } from "@/lib/bookings/quoteDelivery";

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
    const total = round2(
      keptLines.reduce((sum: number, l: { total?: number }) => sum + (Number(l.total) || 0), 0)
    );
    const deposit = depositFor(total);

    // Reserving sends the deposit request → move to "Deposit Invoice Sent". Core
    // columns first so the reserve always persists.
    const { error: updErr } = await supabase
      .from("bookings")
      .update({
        quote_line_items: keptLines,
        quote_subtotal: total,
        quote_total: total,
        status: "deposit_invoice_sent",
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
        new_status: "deposit_invoice_sent",
        changed_by: "customer",
      }),
      supabase.from("activity_log").insert({
        booking_id: bookingId,
        action: "Customer reserved their date — deposit invoice sent",
        metadata: { total, deposit, removed_lines: removed },
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
