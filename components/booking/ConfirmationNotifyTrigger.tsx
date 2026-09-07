"use client";

import { useDelayedBookingNotify } from "@/hooks/useDelayedBookingNotify";

/** Invisible — just fires the delayed customer confirmation from this page. */
export function ConfirmationNotifyTrigger({ bookingId, token }: { bookingId?: string; token?: string }) {
  useDelayedBookingNotify(bookingId, token);
  return null;
}
