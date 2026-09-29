/**
 * One-off data-repair script for the 3 bookings hit by the "reserve overwrites
 * admin-edited quote_total with a stale line-items total" bug (fixed in
 * app/api/quote/reserve/route.ts, commit 8ba91b4). Writes only these three
 * booking rows + an activity_log entry each. Run once.
 *
 * Run with: npx tsx scripts/fix-stale-quote-bookings.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envContent = readFileSync(".env.local", "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // 1) RMV-2026-7BT22 (Raghav) — already self-corrected by admin at the time,
  //    fully paid at the intended £1400. NOTHING to change.

  // 2) RMV-2026-RVVN5 (Antony) — job_completed, already fully paid. The bug
  //    caused the auto full-balance invoice to bill against £730.20 instead of
  //    the admin's actual £700 quote, so the customer paid £30.20 more than
  //    quoted. Per instruction: records-only fix, no Stripe refund issued here.
  //    Correct the booking's stored total to the true £700 and leave the
  //    invoices table untouched (it's the historical record of what actually
  //    moved — £140 deposit + £590.20 balance = £730.20 actually collected).
  {
    const bookingId = "2484ccb0-4dfb-4744-863b-4f23e53de898";
    const trueTotal = 700;
    const trueDeposit = 175; // depositFor(700) — for record consistency only;
    // the £140 deposit actually invoiced/paid was a manual admin figure and is
    // untouched in the invoices table.
    const { error } = await supabase
      .from("bookings")
      .update({ quote_total: trueTotal, quote_subtotal: trueTotal, deposit_amount: trueDeposit })
      .eq("id", bookingId);
    if (error) throw new Error(`RVVN5 update failed: ${error.message}`);

    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Data fix: quote_total corrected £730.20 → £700.00 (reserve-route bug overwrote the admin's edited price)",
      metadata: {
        reason: "reserve-route stale-total bug",
        correctedQuoteTotal: trueTotal,
        actualAmountCollected: 730.2,
        overchargeNotRefunded: 30.2,
        note: "Customer was charged £730.20 total (£140 deposit + £590.20 balance) against a £700 quote. No Stripe refund issued — admin decision pending.",
      },
      performed_by: "admin",
    });
    console.log("✅ RMV-2026-RVVN5 (Antony Hiscock): quote_total corrected to £700.00. £30.20 overcharge logged, NOT refunded — action needed.");
  }

  // 3) RMV-2026-24CBF (Dr-Ali) — deposit_invoice_sent, unpaid. quote_total is
  //    already correct (£300, admin's last edit) and the sent deposit invoice
  //    is already correct (£75 = 25% of £300). Only the stale deposit_amount
  //    column (£134.50, left over from the buggy reserve) needs correcting so
  //    the customer's quote page shows £75 (matching the actual invoice) if
  //    they revisit before paying. No money has moved on this booking.
  {
    const bookingId = "b0aa0c7d-e9b9-498f-99fa-6dd79fb531ff";
    const correctDeposit = 75;
    const { error } = await supabase
      .from("bookings")
      .update({ deposit_amount: correctDeposit })
      .eq("id", bookingId);
    if (error) throw new Error(`24CBF update failed: ${error.message}`);

    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Data fix: deposit_amount corrected £134.50 → £75.00 (stale figure from reserve-route bug; matches the already-sent £75 deposit invoice)",
      metadata: { reason: "reserve-route stale-total bug", correctedDepositAmount: correctDeposit },
      performed_by: "admin",
    });
    console.log("✅ RMV-2026-24CBF (Dr-Ali Raza Nemati): deposit_amount corrected to £75.00 — now matches the sent invoice. No money was involved.");
  }

  console.log("\nDone. RMV-2026-7BT22 needed no change (already self-corrected and fully paid correctly).");
}

main();
