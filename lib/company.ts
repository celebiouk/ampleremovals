/**
 * Public company info used across the site + SEO structured data.
 *
 * NOTE: OPENING_HOURS are sensible defaults for a home-removals firm — edit here
 * (one place) if your real hours differ. The schema.org spec below is kept in
 * step with these for search-engine rich results.
 */

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/ampleremovals",
  tiktok: "https://www.tiktok.com/@ampleremovals",
} as const;

/** Human-readable opening hours (shown in the footer). Open 7 days a week. */
export const OPENING_HOURS: { days: string; time: string }[] = [
  { days: "Monday – Sunday", time: "8:00am – 6:00pm" },
];

/** schema.org openingHoursSpecification (must mirror OPENING_HOURS). */
export const OPENING_HOURS_SPEC = [
  { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "08:00", closes: "18:00" },
];

/** Primary SEO service keywords (also used in page metadata). */
export const SEO_KEYWORDS = [
  "Home Removals",
  "Man and Van",
  "Business Moves",
  "Commercial Moves",
  "Long Distance Removals",
  "Business removals",
  "Removals",
];
