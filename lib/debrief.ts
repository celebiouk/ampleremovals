/**
 * End-of-day debrief (deterministic, no AI). Compares the planned route against
 * what actually happened (arrival/completion timestamps from the driver app):
 * on-time %, late stops, planned miles + estimated fuel cost.
 */
import { ukMinutesOfDay } from "@/lib/dates";

const FUEL_COST_PER_MILE = 0.22; // ~van diesel; adjust as needed
const ON_TIME_GRACE_MIN = 10;

export interface DebriefStop {
  reference: string;
  targetArrival: string;
  actualArrival: string | null;
  lateByMin: number | null;
  onTime: boolean | null;
  completed: boolean;
}

export interface Debrief {
  plannedMiles: number;
  totalStops: number;
  arrivedStops: number;
  completedStops: number;
  onTimeStops: number;
  onTimePct: number | null;
  lateStops: number;
  fuelCostEstimate: number;
  rows: DebriefStop[];
}

function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return (h % 24) * 60 + (m || 0);
}
function minToHHMM(min: number): string {
  const h = Math.floor(min / 60) % 24;
  return `${String(h).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function buildDebrief(supabase: any, driverId: string, date: string): Promise<Debrief | null> {
  const { data: plan } = await supabase
    .from("route_plans")
    .select("total_miles, stops")
    .eq("driver_id", driverId)
    .eq("plan_date", date)
    .maybeSingle();
  if (!plan) return null;

  const stops = (plan.stops ?? []).filter((s: any) => !s.isBreak && s.bookingId && s.bookingId !== "break");
  const bookingIds = stops.map((s: any) => s.bookingId);
  const actualsById = new Map<string, { arrived_at: string | null; completed_at: string | null }>();
  if (bookingIds.length > 0) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, arrived_at, completed_at")
      .in("id", bookingIds);
    for (const b of bookings ?? []) actualsById.set(b.id, { arrived_at: b.arrived_at ?? null, completed_at: b.completed_at ?? null });
  }

  const rows: DebriefStop[] = [];
  let arrivedStops = 0, completedStops = 0, onTimeStops = 0, lateStops = 0;

  for (const s of stops) {
    const actual = actualsById.get(s.bookingId);
    const arrived = actual?.arrived_at ?? null;
    const completed = Boolean(actual?.completed_at);
    let lateByMin: number | null = null;
    let onTime: boolean | null = null;
    if (arrived) {
      arrivedStops++;
      const actualMin = ukMinutesOfDay(arrived);
      lateByMin = actualMin - hhmmToMin(s.targetArrival);
      onTime = lateByMin <= ON_TIME_GRACE_MIN;
      if (onTime) onTimeStops++; else lateStops++;
    }
    if (completed) completedStops++;
    rows.push({
      reference: s.reference,
      targetArrival: s.targetArrival,
      actualArrival: arrived ? minToHHMM(ukMinutesOfDay(arrived)) : null,
      lateByMin, onTime, completed,
    });
  }

  return {
    plannedMiles: Number(plan.total_miles ?? 0),
    totalStops: stops.length,
    arrivedStops,
    completedStops,
    onTimeStops,
    onTimePct: arrivedStops > 0 ? Math.round((onTimeStops / arrivedStops) * 100) : null,
    lateStops,
    fuelCostEstimate: Math.round(Number(plan.total_miles ?? 0) * FUEL_COST_PER_MILE * 100) / 100,
    rows,
  };
}
