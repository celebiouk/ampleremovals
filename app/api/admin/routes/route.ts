/**
 * GET  /api/admin/routes?date=YYYY-MM-DD — route plans for a date (per driver)
 * POST /api/admin/routes  { date } — build/rebuild plans for that date on demand
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { buildRoutePlan, type RouteStopInput } from "@/lib/route-planning";
import { ukToday } from "@/lib/dates";

const CONFIRMED = ["deposit_paid_job_confirmed", "full_invoice_sent", "full_balance_paid"];

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const date = new URL(req.url).searchParams.get("date") || ukToday();
  const supabase = createAdminClient();

  const { data: plans } = await supabase
    .from("route_plans")
    .select("*, driver:drivers(first_name, last_name, preferred_name)")
    .eq("plan_date", date)
    .order("created_at", { ascending: true });

  return NextResponse.json({ success: true, date, plans: plans ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { date } = await req.json().catch(() => ({}));
  const planDate = date || ukToday();
  const supabase = createAdminClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`id, reference, service_type, status,
      origin:addresses!origin_address_id(postcode, lat, lng),
      assignments:booking_driver_assignments(id, driver_id)`)
    .eq("move_date", planDate)
    .in("status", CONFIRMED)
    .limit(1000);

  const byDriver = new Map<string, { stops: RouteStopInput[]; assignmentIds: Map<string, string> }>();
  for (const b of bookings ?? []) {
    const origin = Array.isArray(b.origin) ? b.origin[0] : b.origin;
    for (const a of ((b.assignments ?? []) as { id: string; driver_id: string }[])) {
      if (!byDriver.has(a.driver_id)) byDriver.set(a.driver_id, { stops: [], assignmentIds: new Map() });
      const e = byDriver.get(a.driver_id)!;
      e.stops.push({ bookingId: b.id, reference: b.reference, serviceType: b.service_type, postcode: origin?.postcode ?? "", lat: origin?.lat ?? null, lng: origin?.lng ?? null });
      e.assignmentIds.set(b.id, a.id);
    }
  }

  let built = 0;
  for (const [driverId, { stops, assignmentIds }] of byDriver) {
    const plan = buildRoutePlan(stops);
    await supabase.from("route_plans").upsert({
      driver_id: driverId, plan_date: planDate,
      recommended_start: plan.recommendedStart, total_stops: plan.totalStops, total_miles: plan.totalMiles, stops: plan.stops,
    }, { onConflict: "driver_id,plan_date" });
    for (const s of plan.stops) {
      if (s.isBreak) continue;
      const aId = assignmentIds.get(s.bookingId);
      if (aId) await supabase.from("booking_driver_assignments").update({ route_sequence: s.seq }).eq("id", aId);
    }
    built++;
  }

  return NextResponse.json({ success: true, planDate, driversPlanned: built });
}
