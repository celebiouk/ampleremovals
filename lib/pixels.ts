/**
 * Marketing pixel helpers — Meta (Facebook) Pixel + Google (GA4 / Ads).
 *
 * Pixel IDs come from env vars so nothing is hardcoded:
 *   NEXT_PUBLIC_FB_PIXEL_ID        — Meta Pixel id
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID  — GA4 measurement id (G-XXXX)
 *
 * All functions are safe no-ops when the pixels aren't loaded/configured.
 */

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/** Fire a "Lead" conversion on both platforms when a booking is submitted. */
export function trackLead(detail: { reference: string; service: string }): void {
  if (typeof window === "undefined") return;
  try {
    window.fbq?.("track", "Lead", { content_name: detail.service, content_category: "booking" });
  } catch { /* pixel not loaded */ }
  try {
    window.gtag?.("event", "generate_lead", { service: detail.service, transaction_id: detail.reference });
  } catch { /* gtag not loaded */ }
}
