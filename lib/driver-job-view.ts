/**
 * Driver-facing job visibility. What a driver can see about a customer depends on
 * where the job is in its lifecycle:
 *   • pending / accepted (>24h before): name + addresses, but NOT phone or email
 *   • accepted, ≤24h before the job:    + phone (email is NEVER shown)
 *   • completed:                        redacted — no name/address/email/phone;
 *                                       only the outward postcodes + the rating
 * Enforced server-side so the app can only ever render what the API returns.
 */
import { dateOnly } from "./dates";

export type JobPhase = "pending" | "declined" | "accepted" | "completed";

/** UK wall-clock job start (move_date + move_time, default 08:00) as epoch ms. */
function jobStartMs(moveDate: string | null, moveTime: string | null): number | null {
  const d = dateOnly(moveDate);
  if (!d) return null;
  const t = moveTime && /^\d{2}:\d{2}/.test(moveTime) ? moveTime.slice(0, 5) : "08:00";
  const naiveUtc = Date.parse(`${d}T${t}:00Z`);
  if (Number.isNaN(naiveUtc)) return null;
  // Convert the UK wall-clock time to a real UTC epoch (handles BST/GMT).
  const ref = new Date(naiveUtc);
  const ukOffsetMin =
    (new Date(ref.toLocaleString("en-US", { timeZone: "Europe/London" })).getTime() -
      new Date(ref.toLocaleString("en-US", { timeZone: "UTC" })).getTime()) /
    60000;
  return naiveUtc - ukOffsetMin * 60000;
}

/** UK postcode outward code, e.g. "RM10 7XY" → "RM10". */
export function outwardCode(postcode: string | null | undefined): string | null {
  if (!postcode) return null;
  return postcode.trim().toUpperCase().split(/\s+/)[0] || null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Redact one booking for a driver, in place-safe (returns a new shallow object).
 * `acceptanceStatus` comes from booking_driver_assignments.
 */
export function redactJobForDriver(booking: any, acceptanceStatus: string | null): any {
  const completed = Boolean(booking.completed_at) || booking.status === "job_completed";
  const status = (acceptanceStatus ?? "pending") as JobPhase;
  const phase: JobPhase = completed ? "completed" : status === "declined" ? "declined" : status === "accepted" ? "accepted" : "pending";

  const startMs = jobStartMs(booking.move_date, booking.move_time);
  const hoursUntil = startMs != null ? (startMs - Date.now()) / 3_600_000 : Infinity;
  const showPhone = phase === "accepted" && hoursUntil <= 24;

  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  const origin = Array.isArray(booking.origin) ? booking.origin[0] : booking.origin;
  const destination = Array.isArray(booking.destination) ? booking.destination[0] : booking.destination;

  if (phase === "completed") {
    // Past job — only the outward postcodes + the rating survive.
    return {
      ...booking,
      acceptance_status: acceptanceStatus ?? "pending",
      visibility_phase: phase,
      customer: null,
      origin: origin ? { postcode_outward: outwardCode(origin.postcode) } : null,
      destination: destination ? { postcode_outward: outwardCode(destination.postcode) } : null,
      rating: booking.survey_rating ?? null,
      // strip any chain-of-custody PII fields too
      pickup_contact_name: null,
      delivery_contact_name: null,
    };
  }

  // Active job: name + addresses; phone only ≤24h before; email never.
  return {
    ...booking,
    acceptance_status: acceptanceStatus ?? "pending",
    visibility_phase: phase,
    hours_until_job: Number.isFinite(hoursUntil) ? Math.round(hoursUntil) : null,
    phone_unlocks_in_hours: showPhone ? 0 : Number.isFinite(hoursUntil) ? Math.max(0, Math.round(hoursUntil - 24)) : null,
    customer: customer
      ? { full_name: customer.full_name ?? null, phone: showPhone ? customer.phone ?? null : null, email: null }
      : null,
  };
}
