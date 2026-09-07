"use client";

import { useEffect } from "react";

const DELAY_MS = 60_000;

/**
 * Fires the customer's booking confirmation (email/SMS/WhatsApp) ~60 seconds
 * after this page mounts, so they get a moment to read the booking/quote screen
 * before it lands — rather than the instant they submitted. If they navigate
 * away or close the tab before the timer fires, a `pagehide` listener sends the
 * same request via `sendBeacon` so it still goes out, just without waiting.
 *
 * Safe to call on every mount (including resuming an old booking days later) —
 * the server endpoint is idempotent, so a repeat call is a harmless no-op.
 */
export function useDelayedBookingNotify(bookingId?: string | null, token?: string | null) {
  useEffect(() => {
    if (!bookingId || !token) return;

    const payload = JSON.stringify({ bookingId, token });
    let fired = false;

    const send = () => {
      if (fired) return;
      fired = true;
      fetch("/api/booking/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload })
        .catch(() => { /* best-effort */ });
    };

    const timer = setTimeout(send, DELAY_MS);

    const onHide = () => {
      if (fired) return;
      fired = true;
      // sendBeacon survives page unload; a plain fetch would be cancelled.
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon?.("/api/booking/notify", blob);
    };
    window.addEventListener("pagehide", onHide);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pagehide", onHide);
      // Covers navigating elsewhere WITHIN the app (no real page unload, so
      // pagehide never fires) — a plain fetch still works here since the page
      // hasn't actually gone away yet.
      send();
    };
  }, [bookingId, token]);
}
