/**
 * GET /api/admin/routes/debrief?driverId=&date= — end-of-day debrief comparing
 * the planned route against actual arrival/completion times.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { buildDebrief } from "@/lib/debrief";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const driverId = url.searchParams.get("driverId");
  const date = url.searchParams.get("date");
  if (!driverId || !date) return NextResponse.json({ success: false, error: "driverId and date required" }, { status: 400 });

  const supabase = createAdminClient();
  const debrief = await buildDebrief(supabase, driverId, date);
  return NextResponse.json({ success: true, debrief });
}
