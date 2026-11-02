/**
 * Thin wrapper around gtag for conversion events — phone clicks, WhatsApp
 * clicks and "Get a free Quote" clicks. Previously only page_view was ever
 * sent (set up in components/GoogleAnalytics.tsx), so there was no way to
 * see which pages actually drove leads vs just traffic.
 *
 * Safe to call from anywhere: no-ops if gtag hasn't loaded (GA disabled,
 * ad-blocker, etc.) rather than throwing.
 */

type GtagEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(action: string, params: GtagEventParams = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", action, params);
}

/** "Get a free Quote" CTA clicked — GA4's recommended standard event name
 *  for a lead-gen action, so it surfaces in GA4's built-in conversions. */
export function trackQuoteClick(source: string) {
  trackEvent("generate_lead", { event_category: "conversion", event_label: source });
}

export function trackPhoneClick(source: string) {
  trackEvent("contact_phone_click", { event_category: "conversion", event_label: source });
}

export function trackWhatsAppClick(source: string) {
  trackEvent("contact_whatsapp_click", { event_category: "conversion", event_label: source });
}
