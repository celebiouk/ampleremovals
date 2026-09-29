/**
 * READ-ONLY diagnostic script: find bookings hit by the "reserve overwrites
 * an admin's edited quote_total with a stale line-items total" bug (fixed in
 * app/api/quote/reserve/route.ts).
 *
 * Detection: an activity_log "Quote tiers set: Standard £X" entry (admin edit)
 * followed by a later "Customer reserved their date" entry whose recorded
 * total != X. That mismatch means the reserve step clobbered the admin's
 * edited price with the stale line-item sum.
 *
 * Run with: npx tsx scripts/find-stale-quote-bookings.ts
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

const gbp = (n: number) => `£${Number(n).toFixed(2)}`;

async function main() {
  console.log("Scanning activity_log for admin quote edits + customer reserves...\n");

  const { data: logs, error } = await supabase
    .from("activity_log")
    .select("booking_id, action, metadata, performed_by, created_at")
    .in("performed_by", ["admin", "customer"])
    .or("action.ilike.Quote tiers set%,action.ilike.Customer reserved their date%")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }
  if (!logs || logs.length === 0) {
    console.log("No matching activity_log entries found.");
    return;
  }

  // Group by booking_id, walk chronologically.
  const byBooking = new Map<string, typeof logs>();
  for (const row of logs) {
    if (!row.booking_id) continue;
    if (!byBooking.has(row.booking_id)) byBooking.set(row.booking_id, []);
    byBooking.get(row.booking_id)!.push(row);
  }

  type Affected = {
    bookingId: string;
    adminSetTotal: number;
    adminSetAt: string;
    reservedTotal: number;
    reservedAt: string;
  };
  const affected: Affected[] = [];

  for (const [bookingId, rows] of byBooking) {
    let lastAdminTotal: number | null = null;
    let lastAdminAt: string | null = null;
    for (const row of rows) {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      if (row.action?.startsWith("Quote tiers set") && row.performed_by === "admin") {
        const t = Number(meta.standardTotal);
        if (Number.isFinite(t)) {
          lastAdminTotal = t;
          lastAdminAt = row.created_at;
        }
      } else if (row.action?.startsWith("Customer reserved their date") && row.performed_by === "customer") {
        const reservedTotal = Number(meta.total);
        if (lastAdminTotal != null && Number.isFinite(reservedTotal) && Math.abs(reservedTotal - lastAdminTotal) > 0.01) {
          affected.push({
            bookingId,
            adminSetTotal: lastAdminTotal,
            adminSetAt: lastAdminAt!,
            reservedTotal,
            reservedAt: row.created_at,
          });
        }
        // A reserve event consumes the pending admin edit — if the admin edits
        // again later, that's a fresh comparison.
        lastAdminTotal = null;
      }
    }
  }

  if (affected.length === 0) {
    console.log("✅ No affected bookings found — no admin edit was ever overwritten by a stale reserve.");
    return;
  }

  console.log(`⚠️  Found ${affected.length} affected booking(s):\n`);

  for (const a of affected) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("reference, status, quote_total, deposit_amount, customer:customers!inner(full_name, email, phone)")
      .eq("id", a.bookingId)
      .maybeSingle();

    const { data: invoices } = await supabase
      .from("invoices")
      .select("type, status, total, paid_at, created_at")
      .eq("booking_id", a.bookingId)
      .order("created_at", { ascending: true });

    const customer = booking && Array.isArray(booking.customer) ? booking.customer[0] : booking?.customer;

    console.log("──────────────────────────────────────────");
    console.log(`Booking:        ${booking?.reference ?? a.bookingId} (${a.bookingId})`);
    console.log(`Customer:       ${customer?.full_name ?? "?"} <${customer?.email ?? "?"}> ${customer?.phone ?? ""}`);
    console.log(`Status now:     ${booking?.status ?? "?"}`);
    console.log(`Admin set total: ${gbp(a.adminSetTotal)}  (at ${a.adminSetAt})`);
    console.log(`Reserve total:   ${gbp(a.reservedTotal)}  (at ${a.reservedAt})  ← what got saved instead`);
    console.log(`quote_total NOW: ${booking?.quote_total != null ? gbp(booking.quote_total) : "?"}`);
    console.log(`deposit_amount NOW: ${booking?.deposit_amount != null ? gbp(booking.deposit_amount) : "?"}`);
    if (invoices && invoices.length) {
      for (const inv of invoices) {
        console.log(`  invoice[${inv.type}] status=${inv.status} total=${gbp(inv.total)} created=${inv.created_at}${inv.paid_at ? ` paid=${inv.paid_at}` : ""}`);
      }
    } else {
      console.log("  (no invoices on this booking)");
    }
  }
  console.log("──────────────────────────────────────────");
  console.log(`\nTotal affected: ${affected.length}. This script made NO changes.`);
}

main();
