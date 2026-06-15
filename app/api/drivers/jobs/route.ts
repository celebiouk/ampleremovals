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

    // NB: addresses(*) not (lat,lng) — resilient if the lat/lng columns aren't
    // present yet (otherwise PostgREST 500s with "column does not exist"). The
    // app reads origin.lat/lng when available, falls back to manual arrival.
    let q = supabase
      .from("bookings")
      .select(
        `*,
         customer:customers(full_name, phone, email),
         origin:addresses!origin_address_id(*),
         destination:addresses!destination_address_id(*)`
      )
      .in("id", ids)
      .order("move_date", { ascending: true });

    const today = new Date().toISOString().slice(0, 10);
    // A booking "falls on" a day via a fixed move_date OR a flexible date range
    // that spans it — so flexible-date jobs still appear in today/week/upcoming.
    const flexSpans = (from: string, to: string) =>
      `and(is_flexible_date.is.true,flexible_date_from.lte.${to},flexible_date_to.gte.${from})`;

    if (scope === "today") {
      q = q.or(`move_date.eq.${today},${flexSpans(today, today)}`);
    } else if (scope === "upcoming") {
      q = q.or(`move_date.gte.${today},and(is_flexible_date.is.true,flexible_date_to.gte.${today})`);
    } else if (scope === "week") {
      const now = new Date();
      const day = (now.getDay() + 6) % 7; // Monday=0
      const start = new Date(now); start.setDate(now.getDate() - day);
      const end = new Date(start); end.setDate(start.getDate() + 6);
      const s = start.toISOString().slice(0, 10);
      const e = end.toISOString().slice(0, 10);
      q = q.or(`and(move_date.gte.${s},move_date.lte.${e}),${flexSpans(s, e)}`);
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, jobs: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
