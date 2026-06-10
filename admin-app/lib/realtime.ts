import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

/** Subscribe to all booking changes (INSERT/UPDATE/DELETE). */
export function subscribeToBookings(callback: () => void): RealtimeChannel {
  return supabase
    .channel(`bookings-${Date.now()}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => callback())
    .subscribe();
}

/** Subscribe to activity_log inserts for a specific booking. */
export function subscribeToBookingActivity(bookingId: string, callback: () => void): RealtimeChannel {
  return supabase
    .channel(`activity-${bookingId}-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "activity_log", filter: `booking_id=eq.${bookingId}` },
      () => callback()
    )
    .subscribe();
}

/** Subscribe to booking_notes changes for a specific booking. */
export function subscribeToBookingNotes(bookingId: string, callback: () => void): RealtimeChannel {
  return supabase
    .channel(`notes-${bookingId}-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "booking_notes", filter: `booking_id=eq.${bookingId}` },
      () => callback()
    )
    .subscribe();
}

export function unsubscribe(channel: RealtimeChannel | null): void {
  if (channel) supabase.removeChannel(channel);
}
