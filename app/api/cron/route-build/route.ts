/**
 * GET /api/cron/route-build — builds tomorrow's optimal route per driver.
 * Runs nightly (daily Vercel cron is fine). Deterministic nearest-neighbour
 * sequencing with target times + a 30-min break after 6h.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { buildRoutePlan, type RouteStopInput } from "@/lib/route-planning";
import { ukToday } from "@/lib/dates";

const CONFIRMED = ["deposit_paid_job_confirmed", "full_invoice_sent", "full_balance_paid"];

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  // Tomorrow in UK time.
  const tomorrow = new Date(ukToday() + "T12:00:00Z");
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const planDate = tomorrow.toISOString().slice(0, 10);

  // Confirmed jobs for tomorrow + their driver assignments + origin coords.
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`id, reference, service_type, status,
      origin:addresses!origin_address_id(postcode, lat, lng),
      assignments:booking_driver_assignments(id, driver_id)`)
    .eq("move_date", planDate)
    .in("status", CONFIRMED)
    .limit(1000);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Group stops by driver.
  const byDriver = new Map<string, { stops: RouteStopInput[]; assignmentIds: Map<string, string> }>();
  for (const b of bookings ?? []) {
    const origin = Array.isArray(b.origin) ? b.origin[0] : b.origin;
    const assigns = (b.assignments ?? []) as { id: string; driver_id: string }[];
    for (const a of assigns) {
      if (!byDriver.has(a.driver_id)) byDriver.set(a.driver_id, { stops: [], assignmentIds: new Map() });
      const entry = byDriver.get(a.driver_id)!;
      entry.stops.push({
        bookingId: b.id, reference: b.reference, serviceType: b.service_type,
        postcode: origin?.postcode ?? "", lat: origin?.lat ?? null, lng: origin?.lng ?? null,
      });
      entry.assignmentIds.set(b.id, a.id);
    }
  }

  let built = 0;
  for (const [driverId, { stops, assignmentIds }] of byDriver) {
    const plan = buildRoutePlan(stops);

    await supabase.from("route_plans").upsert({
      driver_id: driverId,
      plan_date: planDate,
      recommended_start: plan.recommendedStart,
      total_stops: plan.totalStops,
      total_miles: plan.totalMiles,
      stops: plan.stops,
    }, { onConflict: "driver_id,plan_date" });

    // Write sequence onto each assignment (skip the break pseudo-stop).
    for (const s of plan.stops) {
      if (s.isBreak) continue;
      const aId = assignmentIds.get(s.bookingId);
      if (aId) await supabase.from("booking_driver_assignments").update({ route_sequence: s.seq }).eq("id", aId);
    }
    built++;
  }

  return NextResponse.json({ success: true, planDate, driversPlanned: built });
}
