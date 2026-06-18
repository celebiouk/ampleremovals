/**
 * Deterministic driver auto-assignment suggestion (no AI). Ranks active drivers
 * for a booking by a transparent scored filter:
 *   − availability   : a same-day clash is disqualifying-ish (big penalty)
 *   − proximity      : home postcode distance to the pickup (closer = better)
 *   − workload       : fewer jobs already that day (load balancing)
 * Admin keeps full override — this only recommends.
 */
import { geocodePostcode } from "@/lib/postcode";
import { haversineMiles } from "@/lib/route-planning";
import { dateOnly } from "@/lib/dates";

export interface DriverSuggestion {
  driverId: string;
  name: string;
  score: number;
  available: boolean;
  jobsThatDay: number;
  distanceMiles: number | null;
  reasons: string[];
}

const DEAD = ["job_completed", "bad_lead", "not_a_good_fit", "cancelled"];

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function suggestDrivers(supabase: any, bookingId: string): Promise<DriverSuggestion[]> {
  // Target booking: date + pickup coords.
  const { data: booking } = await supabase
    .from("bookings")
    .select("move_date, origin:addresses!origin_address_id(postcode, lat, lng)")
    .eq("id", bookingId)
    .single();
  if (!booking) return [];
  const day = dateOnly(booking.move_date);
  const origin = Array.isArray(booking.origin) ? booking.origin[0] : booking.origin;
  let pickupLat: number | null = origin?.lat ?? null;
  let pickupLng: number | null = origin?.lng ?? null;
  if ((pickupLat == null || pickupLng == null) && origin?.postcode) {
    const c = await geocodePostcode(origin.postcode);
    if (c) { pickupLat = c.lat; pickupLng = c.lng; }
  }

  // Active drivers + who's already assigned to this booking.
  const [{ data: drivers }, { data: alreadyOn }] = await Promise.all([
    supabase.from("drivers").select("id, first_name, last_name, preferred_name, postcode, status").eq("status", "active"),
    supabase.from("booking_driver_assignments").select("driver_id").eq("booking_id", bookingId),
  ]);
  const assignedHere = new Set((alreadyOn ?? []).map((a: any) => a.driver_id));

  // Each active driver's same-day assignments (for clash + workload).
  const candidates = (drivers ?? []).filter((d: any) => !assignedHere.has(d.id));
  const results: DriverSuggestion[] = [];

  for (const d of candidates) {
    const { data: assigns } = await supabase
      .from("booking_driver_assignments")
      .select("booking:bookings(move_date, status)")
      .eq("driver_id", d.id);
    let jobsThatDay = 0;
    for (const a of assigns ?? []) {
      const b = Array.isArray(a.booking) ? a.booking[0] : a.booking;
      if (b && !DEAD.includes(b.status) && dateOnly(b.move_date) === day) jobsThatDay++;
    }

    const reasons: string[] = [];
    let score = 50;
    const available = jobsThatDay === 0;
    if (!available) { score -= 25; reasons.push(`Already on ${jobsThatDay} job${jobsThatDay === 1 ? "" : "s"} that day`); }
    else reasons.push("Free that day");

    // Proximity.
    let distanceMiles: number | null = null;
    if (pickupLat != null && pickupLng != null && d.postcode) {
      const dc = await geocodePostcode(d.postcode);
      if (dc) {
        distanceMiles = Math.round(haversineMiles(pickupLat, pickupLng, dc.lat, dc.lng) * 10) / 10;
        const prox = Math.max(0, 30 - distanceMiles); // up to +30 within ~30mi
        score += prox;
        reasons.push(`${distanceMiles} mi from pickup`);
      }
    }

    // Load balancing (light): each extra same-day job costs a little.
    score -= jobsThatDay * 5;

    results.push({
      driverId: d.id,
      name: d.preferred_name || [d.first_name, d.last_name].filter(Boolean).join(" ") || "Driver",
      score: Math.round(score),
      available, jobsThatDay, distanceMiles, reasons,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}
