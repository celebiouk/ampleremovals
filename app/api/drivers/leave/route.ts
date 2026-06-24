/**
 * /api/drivers/leave — driver requests leave / marks unavailability (POST, → 'pending')
 * or lists their own requests (GET).
 */
import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const b = await req.json().catch(() => null) as { start_date?: string; end_date?: string; reason?: string } | null;
    const start_date = b?.start_date;
    const end_date = b?.end_date || b?.start_date;
    if (!start_date || !end_date) {
      return NextResponse.json({ success: false, error: "Start and end dates are required" }, { status: 400 });
    }
    if (end_date < start_date) {
      return NextResponse.json({ success: false, error: "End date can't be before the start date" }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("driver_leave_requests").insert({
      driver_id: auth.driver.id, start_date, end_date, reason: (b?.reason ?? "").trim() || null, status: "pending",
    }).select("id").single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("driver_leave_requests").select("*").eq("driver_id", auth.driver.id).order("start_date", { ascending: false }).limit(100);
    return NextResponse.json({ success: true, requests: data ?? [] });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
