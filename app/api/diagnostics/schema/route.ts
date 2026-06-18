/**
 * GET /api/diagnostics/schema — checks whether key columns/tables exist.
 * Protected by CRON_SECRET so it can be curled. Read-only.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();

  const checks: { table: string; column: string }[] = [
    { table: "bookings", column: "lead_score" },
    { table: "bookings", column: "lead_band" },
    { table: "bookings", column: "heard_about_us" },
    { table: "bookings", column: "utm_source" },
    { table: "bookings", column: "quote_followup_stage" },
    { table: "addresses", column: "lat" },
    { table: "porters", column: "id" },
    { table: "route_plans", column: "id" },
    { table: "booking_porter_assignments", column: "id" },
  ];

  const result: Record<string, { exists: boolean; error?: string }> = {};
  for (const c of checks) {
    const { error } = await supabase.from(c.table).select(c.column).limit(1);
    result[`${c.table}.${c.column}`] = error ? { exists: false, error: error.message } : { exists: true };
  }

  return NextResponse.json({ success: true, result });
}
