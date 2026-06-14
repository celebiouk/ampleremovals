/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/drivers/jobs?scope=today|upcoming|week — the signed-in driver's jobs.
 * Returns each booking with customer, pickup/delivery addresses (incl. lat/lng for
 * the map + arrival detection) and the journey/chain-of-custody state.
 */

import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;

  try {
    const scope = new URL(req.url).searchParams.get("scope") ?? "today";
    const supabase = createAdminClient();

    const { data: assigns } = await supabase
      .from("booking_driver_assignments")
      .select("booking_id")
      .eq("driver_id", auth.driver.id);
    const ids = (assigns ?? []).map((a: any) => a.booking_id);
    if (ids.length === 0) return NextResponse.json({ success: true, jobs: [] });

    let q = supabase
      .from("bookings")
      .select(
        `*,
         customer:customers(full_name, phone, email),
         origin:addresses!origin_address_id(line_1, line_2, city, postcode, lat, lng),
         destination:addresses!destination_address_id(line_1, line_2, city, postcode, lat, lng)`
      )
      .in("id", ids)
      .order("move_date", { ascending: true });

    const today = new Date().toISOString().slice(0, 10);
    if (scope === "today") q = q.eq("move_date", today);
    else if (scope === "upcoming") q = q.gte("move_date", today);
    else if (scope === "week") {
      const now = new Date();
      const day = (now.getDay() + 6) % 7; // Monday=0
      const start = new Date(now); start.setDate(now.getDate() - day);
      const end = new Date(start); end.setDate(start.getDate() + 6);
      q = q.gte("move_date", start.toISOString().slice(0, 10)).lte("move_date", end.toISOString().slice(0, 10));
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, jobs: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
