import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/** Subscribe to all booking changes (INSERT/UPDATE). */
export function subscribeToBookings(callback: (payload: unknown) => void): RealtimeChannel {
  const supabase = createClient();
  return supabase
    .channel(`bookings-${Date.now()}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, callback)
    .subscribe();
}

/** Subscribe to activity_log inserts for a specific booking. */
export function subscribeToBookingActivity(
  bookingId: string,
  callback: (payload: unknown) => void
): RealtimeChannel {
  const supabase = createClient();
  return supabase
    .channel(`activity-${bookingId}`)
    .on("postgres_changes", {
      event: "INSERT", schema: "public", table: "activity_log",
      filter: `booking_id=eq.${bookingId}`,
    }, callback)
    .subscribe();
}

/** Subscribe to booking_notes inserts for a specific booking. */
export function subscribeToBookingNotes(
  bookingId: string,
  callback: (payload: unknown) => void
): RealtimeChannel {
  const supabase = createClient();
  return supabase
    .channel(`notes-${bookingId}`)
    .on("postgres_changes", {
      event: "*", schema: "public", table: "booking_notes",
      filter: `booking_id=eq.${bookingId}`,
    }, callback)
    .subscribe();
}

export function unsubscribe(channel: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(channel);
}
