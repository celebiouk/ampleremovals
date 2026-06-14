/**
 * GET /api/cron/eta-engine — runs every minute. Fires any due Call 2 / Call 3 of
 * the smart-ETA engine using each driver's last uploaded GPS.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runDueEtaCalls } from "@/lib/driver-eta";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createAdminClient();
    const result = await runDueEtaCalls(supabase);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
