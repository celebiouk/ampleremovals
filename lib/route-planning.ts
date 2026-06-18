/**
 * Deterministic route planning (no AI) — nearest-neighbour sequencing of a
 * driver's stops for a day, with target arrival/completion times and a legally
 * required 30-minute break after 6 hours of work.
 *
 * Travel time is estimated from straight-line (Haversine) miles at an assumed
 * average speed; good enough for sequencing + ETAs without burning Maps calls.
 */

export interface RouteStopInput {
  bookingId: string;
  reference: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
  serviceType: string;
  bedrooms?: string | null;
}

export interface PlannedStop {
  bookingId: string;
  reference: string;
  seq: number;
  postcode: string;
  lat: number | null;
  lng: number | null;
  targetArrival: string;     // "HH:MM"
  targetCompletion: string;  // "HH:MM"
  travelMiles: number;
  jobMinutes: number;
  isBreak?: boolean;
}

export interface RoutePlan {
  recommendedStart: string;
  totalStops: number;
  totalMiles: number;
  stops: PlannedStop[];
}

const AVG_MPH = 25;            // urban + loading allowance
const DAY_START_MIN = 8 * 60;  // 08:00
const BREAK_AFTER_MIN = 6 * 60;
const BREAK_MIN = 30;

const RADIANS = (d: number) => (d * Math.PI) / 180;

/** Straight-line miles between two coordinates. */
export function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const dLat = RADIANS(bLat - aLat);
  const dLng = RADIANS(bLng - aLng);
  const lat1 = RADIANS(aLat);
  const lat2 = RADIANS(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

const BEDROOM_JOB_MIN: Record<string, number> = {
  studio: 60, "1": 90, "2": 120, "3": 150, "4": 180, "5+": 210,
};

function jobMinutesFor(stop: RouteStopInput): number {
  if (stop.serviceType === "house_cleaning" || stop.serviceType === "end_of_tenancy") return 120;
  if (stop.serviceType === "man_and_van") return 90;
  return stop.bedrooms ? (BEDROOM_JOB_MIN[stop.bedrooms] ?? 120) : 120;
}

function fmt(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Build the day's plan. `start` is the driver's home/depot coordinate (falls back
 * to the first stop with coords). Stops without coordinates are appended in input
 * order at the end (can't be sequenced geographically).
 */
export function buildRoutePlan(stops: RouteStopInput[], start?: { lat: number; lng: number }): RoutePlan {
  const geo = stops.filter((s) => s.lat != null && s.lng != null);
  const noGeo = stops.filter((s) => s.lat == null || s.lng == null);

  // Nearest-neighbour ordering.
  const remaining = [...geo];
  const ordered: RouteStopInput[] = [];
  let curLat = start?.lat ?? geo[0]?.lat ?? 0;
  let curLng = start?.lng ?? geo[0]?.lng ?? 0;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineMiles(curLat, curLng, remaining[i].lat!, remaining[i].lng!);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    curLat = next.lat!; curLng = next.lng!;
  }
  const sequence = [...ordered, ...noGeo];

  // Time + distance walk, inserting a break after 6h of work.
  const planned: PlannedStop[] = [];
  let clock = DAY_START_MIN;
  let workedSinceBreak = 0;
  let breakInserted = false;
  let totalMiles = 0;
  let pLat = start?.lat ?? sequence[0]?.lat ?? null;
  let pLng = start?.lng ?? sequence[0]?.lng ?? null;
  let seq = 1;

  for (const stop of sequence) {
    const travelMiles = pLat != null && stop.lat != null ? haversineMiles(pLat, pLng!, stop.lat, stop.lng!) : 0;
    const travelMin = Math.round((travelMiles / AVG_MPH) * 60);
    clock += travelMin;
    totalMiles += travelMiles;

    if (!breakInserted && workedSinceBreak >= BREAK_AFTER_MIN) {
      planned.push({ bookingId: "break", reference: "Break", seq: seq++, postcode: "", lat: null, lng: null, targetArrival: fmt(clock), targetCompletion: fmt(clock + BREAK_MIN), travelMiles: 0, jobMinutes: BREAK_MIN, isBreak: true });
      clock += BREAK_MIN;
      workedSinceBreak = 0;
      breakInserted = true;
    }

    const jobMin = jobMinutesFor(stop);
    const arrival = clock;
    clock += jobMin;
    workedSinceBreak += jobMin + travelMin;

    planned.push({
      bookingId: stop.bookingId, reference: stop.reference, seq: seq++,
      postcode: stop.postcode, lat: stop.lat, lng: stop.lng,
      targetArrival: fmt(arrival), targetCompletion: fmt(clock),
      travelMiles: Math.round(travelMiles * 10) / 10, jobMinutes: jobMin,
    });
    if (stop.lat != null) { pLat = stop.lat; pLng = stop.lng; }
  }

  return {
    recommendedStart: fmt(DAY_START_MIN),
    totalStops: sequence.length,
    totalMiles: Math.round(totalMiles * 10) / 10,
    stops: planned,
  };
}
