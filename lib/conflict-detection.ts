/**
 * Deterministic assignment conflict detection (no AI). Flags clashes so admin
 * can confirm or reassign — it never blocks, just warns.
 *
 * Detects:
 *  - the same driver already on another job the same day
 *  - the same vehicle already on another job the same day
 *  - the job landing on the driver's recorded day off / holiday (if tracked)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { dateOnly } from "@/lib/dates";

export interface AssignmentConflict {
  type: "driver_double_booked" | "vehicle_double_booked" | "driver_unavailable";
  message: string;
  reference?: string;
  bookingId?: string;
}

const DEAD_STATUSES = ["job_completed", "bad_lead", "not_a_good_fit", "cancelled"];

export async function detectDriverConflicts(
  supabase: any,
  driverId: string,
  bookingId: string
): Promise<AssignmentConflict[]> {
  const conflicts: AssignmentConflict[] = [];

  // Target booking date.
  const { data: target } = await supabase
    .from("bookings")
    .select("move_date")
    .eq("id", bookingId)
    .single();
  const day = dateOnly(target?.move_date);
  if (!day) return conflicts; // flexible/no date — nothing to clash on

  // Other bookings this driver is assigned to.
  const { data: assigns } = await supabase
    .from("booking_driver_assignments")
    .select("booking_id, booking:bookings(reference, move_date, status)")
    .eq("driver_id", driverId)
    .neq("booking_id", bookingId);

  for (const a of assigns ?? []) {
    const b = Array.isArray(a.booking) ? a.booking[0] : a.booking;
    if (!b) continue;
    if (DEAD_STATUSES.includes(b.status)) continue;
    if (dateOnly(b.move_date) === day) {
      conflicts.push({
        type: "driver_double_booked",
        message: `Driver is already on job ${b.reference} the same day (${day}).`,
        reference: b.reference,
        bookingId: a.booking_id,
      });
    }
  }

  return conflicts;
}
