/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET  /api/drivers/time — today's clock state for the driver (entries + computed status)
 * POST /api/drivers/time — record a clock_in | clock_out | break_start | break_end
 */

import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

const TYPES = ["clock_in", "clock_out", "break_start", "break_end"];

export async function GET() {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("driver_time_entries")
      .select("entry_type, at")
      .eq("driver_id", auth.driver.id)
      .gte("at", since.toISOString())
      .order("at", { ascending: true });

    const entries = data ?? [];
    const last = entries[entries.length - 1];
    const clockedIn = entries.some((e: any) => e.entry_type === "clock_in") && last?.entry_type !== "clock_out";
    const onBreak = last?.entry_type === "break_start";
    return NextResponse.json({ success: true, entries, status: { clockedIn, onBreak } });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const { entry_type } = await req.json();
    if (!TYPES.includes(entry_type)) {
      return NextResponse.json({ success: false, error: "Invalid entry_type" }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { error } = await supabase.from("driver_time_entries").insert({
      driver_id: auth.driver.id, entry_type, at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
