/**
 * Marketing attribution — capture where a lead came from.
 *
 * On a visitor's FIRST landing we record UTM params, Google/Meta click ids,
 * the referrer and landing page into localStorage (first-touch wins). When they
 * later submit a booking we attach that snapshot so admin sees the true source
 * even if they browsed around first.
 */

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landing_page?: string;
}

const STORAGE_KEY = "ample_attribution";

/**
 * Record first-touch attribution if not already stored. Safe to call on every
 * page load — it only writes the first time (so the original source sticks).
 * Browser-only.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(STORAGE_KEY)) return; // first-touch already captured

    const params = new URLSearchParams(window.location.search);
    const get = (k: string) => params.get(k) || undefined;

    const attr: Attribution = {
      utm_source: get("utm_source"),
      utm_medium: get("utm_medium"),
      utm_campaign: get("utm_campaign"),
      utm_term: get("utm_term"),
      utm_content: get("utm_content"),
      gclid: get("gclid"),
      fbclid: get("fbclid"),
      referrer: document.referrer || undefined,
      landing_page: window.location.pathname + window.location.search,
    };

    // Only persist if there's something meaningful (a param or an external referrer).
    const external = attr.referrer && !attr.referrer.includes(window.location.host);
    const hasSignal = Object.entries(attr).some(([k, v]) => v && k !== "referrer" && k !== "landing_page") || external;
    if (hasSignal) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attr));
  } catch {
    /* localStorage blocked (private mode) — attribution is best-effort */
  }
}

/** Read the stored first-touch attribution (browser-only). */
export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}

/**
 * Derive a single human-readable channel from raw attribution. Pure + isomorphic
 * (used server-side when persisting the booking). Priority: paid click ids →
 * explicit utm_source → referrer host → direct.
 */
export function deriveSource(a: Attribution | null | undefined): string {
  if (!a) return "direct";
  if (a.gclid) return "google_ads";
  if (a.fbclid) return "facebook_ads";

  const utm = a.utm_source?.toLowerCase();
  if (utm) {
    if (utm.includes("facebook") || utm.includes("fb") || utm.includes("meta") || utm.includes("instagram") || utm.includes("ig")) return "facebook";
    if (utm.includes("google")) return a.utm_medium?.toLowerCase().includes("cpc") ? "google_ads" : "google";
    if (utm.includes("bing")) return "bing";
    return utm; // honour whatever the campaign tagged
  }

  const ref = a.referrer?.toLowerCase();
  if (ref) {
    if (ref.includes("google.")) return "google_organic";
    if (ref.includes("facebook.") || ref.includes("instagram.") || ref.includes("fb.")) return "facebook_organic";
    if (ref.includes("bing.")) return "bing_organic";
    if (ref.includes("duckduckgo.")) return "search_organic";
    try {
      return "referral:" + new URL(a.referrer!).hostname.replace(/^www\./, "");
    } catch {
      return "referral";
    }
  }

  return "direct";
}
