/**
 * GET /api/cron/eta-engine — runs every minute. Fires any due Call 2 / Call 3 of
 * the smart-ETA engine using each driver's last uploaded GPS.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runDueEtaCalls, refreshActiveEtas } from "@/lib/driver-eta";
import { runDueBalanceInvoices } from "@/lib/auto-full-invoice";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createAdminClient();
    const result = await runDueEtaCalls(supabase);
    // Keep every active journey's ETA fresh from the driver's live GPS.
    const live = await refreshActiveEtas(supabase);
    // Send any move-day balance invoices whose ~20-min delay has elapsed.
    const balance = await runDueBalanceInvoices(supabase);
    return NextResponse.json({ success: true, ...result, ...live, ...balance });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
