/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/drivers/jobs?scope=today|upcoming|week — the signed-in driver's jobs.
 * Returns each booking with customer, pickup/delivery addresses (incl. lat/lng for
 * the map + arrival detection) and the journey/chain-of-custody state.
 */

import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { ukToday, ukNextDays, dateOnly } from "@/lib/dates";

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

    // NB: addresses(*) not (lat,lng) — resilient if the lat/lng columns aren't
    // present yet (otherwise PostgREST 500s with "column does not exist"). The
    // app reads origin.lat/lng when available, falls back to manual arrival.
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `*,
         customer:customers(full_name, phone, email),
         origin:addresses!origin_address_id(*),
         destination:addresses!destination_address_id(*)`
      )
      .in("id", ids)
      .order("move_date", { ascending: true });
    if (error) throw new Error(error.message);

    // Filter by scope in JS using UK calendar dates + string comparison. A
    // booking falls on a day via a fixed move_date OR a flexible range spanning
    // it. (Done here, not in SQL, to keep timezone logic correct and avoid
    // fragile PostgREST or()/date casts.)
    const today = ukToday();
    // "week" now means a rolling NEXT 7 DAYS (today → today+7), not the Mon–Sun
    // calendar week — so jobs later this week + early next week all show.
    const { start, end } = ukNextDays(7);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inScope = (b: any): boolean => {
      const md = dateOnly(b.move_date);
      const ff = dateOnly(b.flexible_date_from);
      const ft = dateOnly(b.flexible_date_to);
      const flex = Boolean(b.is_flexible_date) && ff && ft;
      if (scope === "today") {
        return md === today || (flex ? ff! <= today && ft! >= today : false);
      }
      if (scope === "upcoming") {
        return (md ? md >= today : false) || (flex ? ft! >= today : false);
      }
      if (scope === "week") {
        return (md ? md >= start && md <= end : false) || (flex ? ff! <= end && ft! >= start : false);
      }
      return true;
    };

    const jobs = (data ?? []).filter(inScope);
    return NextResponse.json({ success: true, jobs });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
