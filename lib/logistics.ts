/**
 * Ample Logistics — HGV driver recruitment agency (amplelogistics.co.uk).
 * A separate business line from the removals platform: different
 * audience, different forms, different database tables
 * (logistics_driver_requests / logistics_driver_applications), but the
 * SAME Supabase project and the SAME admin dashboard — see
 * tasks/brand-playbook.md for the full explanation of why this is not
 * part of lib/brands.ts's removals `Brand` system.
 */

export const LOGISTICS = {
  name: "Ample Logistics",
  domain: "amplelogistics.co.uk",
  tagline: "Reliable HGV Drivers When Your Business Needs Them",
  emailFrom: "Ample Logistics",
  emailAddress: "hello@amplelogistics.co.uk",
  notifyEmail: "daniel@ampleremovals.com",
  // Ample Removals' own number, by design — unlike the white-label
  // removal brands (which must never look connected to Ample), Ample
  // Logistics is deliberately presented as part of the same company.
  phone: "0333 577 2070",
  phoneHref: "tel:03335772070",
  // Ample's own purple/green — same reasoning as the phone number above:
  // this brand is meant to visibly tie back to Ample, not disguise it.
  // Property names kept as navy/blue/charcoal/amber so nothing else
  // needs to change — only the values moved to Ample's palette.
  colors: {
    navy: "#581c87", // Ample purple-900 — headings, dark hero background
    blue: "#16a34a", // Ample green-600 — CTAs, links, accents
    white: "#FFFFFF",
    lightGrey: "#F4F6F8",
    charcoal: "#3b0764", // Ample purple-950 — deepest end of hero gradients
    amber: "#22c55e", // Ample green-500 — lighter highlight variant
  },
} as const;

/** Berkshire's cities and principal towns — the agency's coverage area. */
export const BERKSHIRE_TOWNS = [
  "Reading",
  "Slough",
  "Bracknell",
  "Maidenhead",
  "Windsor",
  "Newbury",
  "Wokingham",
  "Thatcham",
  "Ascot",
  "Sandhurst",
  "Crowthorne",
  "Hungerford",
  "Twyford",
  "Theale",
  "Burnham",
  "Datchet",
  "Eton",
  "Earley",
  "Tilehurst",
  "Woodley",
  "Caversham",
  "Wargrave",
];

export const LICENCE_CATEGORIES = [
  { value: "C+E", label: "Category C+E (Class 1 — Articulated)" },
  { value: "C", label: "Category C (Class 2 — Rigid)" },
  { value: "C1", label: "Category C1 (7.5t)" },
  { value: "other", label: "Other relevant commercial licence" },
];

export const URGENCY_OPTIONS = [
  { value: "immediate", label: "Immediate" },
  { value: "within_24_hours", label: "Within 24 Hours" },
  { value: "within_7_days", label: "Within 7 Days" },
  { value: "planned_future_requirement", label: "Planned Future Requirement" },
] as const;

export const SHIFT_TYPE_OPTIONS = ["Day Shift", "Night Shift", "Weekend Shift", "Flexible / Mixed"];

export const PREFERRED_WORK_TYPE_OPTIONS = [
  { value: "class_1", label: "Class 1 / C+E" },
  { value: "class_2", label: "Class 2 / Category C" },
  { value: "c1", label: "Category C1" },
  { value: "other", label: "Other relevant commercial driving work" },
];

export const PREFERRED_PATTERN_OPTIONS = [
  { value: "day", label: "Day Shifts" },
  { value: "night", label: "Night Shifts" },
  { value: "weekend", label: "Weekend Shifts" },
  { value: "flexible", label: "Flexible Shifts" },
];

export const DRIVER_REQUEST_STATUSES = [
  "new_request",
  "reviewing",
  "driver_search_in_progress",
  "driver_available",
  "confirmed",
  "completed",
  "cancelled",
  "unable_to_fill",
] as const;

export const DRIVER_APPLICATION_STATUSES = [
  "new_application",
  "under_review",
  "documents_required",
  "approved_for_consideration",
  "active_driver",
  "inactive",
  "rejected",
  "withdrawn",
] as const;

export type DriverRequestStatus = (typeof DRIVER_REQUEST_STATUSES)[number];
export type DriverApplicationStatus = (typeof DRIVER_APPLICATION_STATUSES)[number];

export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Full <head> metadata for a logistics page — title set via `absolute` so
 * it bypasses the root layout's "%s | Ample Removals" template entirely
 * (the same leak class hit earlier with the removal brands' pages — see
 * tasks/brand-playbook.md). Also overrides OG/Twitter/author, which
 * otherwise default to Ample Removals' own values.
 */
export function logisticsPageMetadata(title: string, description: string, path: string) {
  const url = `https://${LOGISTICS.domain}${path}`;
  return {
    title: { absolute: title },
    description,
    authors: [{ name: LOGISTICS.name }],
    alternates: { canonical: url },
    openGraph: {
      type: "website" as const,
      locale: "en_GB",
      url,
      siteName: LOGISTICS.name,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
  };
}

/** LOG-2026-X8K4P style reference, distinct from removals' service-prefixed ones. */
export function generateLogisticsReference(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `LOG-${year}-${code}`;
}
