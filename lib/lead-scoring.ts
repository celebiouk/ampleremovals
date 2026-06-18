/**
 * Deterministic lead scoring (0–100) — no AI, just the weighted rules from the
 * spec. Computed at enquiry time so the team can prioritise hot leads.
 *
 * | Signal              | Condition                    | Score |
 * |---------------------|------------------------------|-------|
 * | Move date           | Within 2 weeks               | +20   |
 * | Form completeness   | All key fields present       | +15   |
 * | Job size            | Larger job = higher value    | +15   |
 * | Time of enquiry     | Business hours (UK)          | +10   |
 * | Traffic source      | Referral/organic vs cold     | +10   |
 * | Returning customer  | Has booked before            | +10   |
 * | Response speed      | (set later when admin acts)  | +20   |
 *
 * Bands: 80+ hot · 60–79 warm · 40–59 nurture · <40 cold.
 */

export type LeadBand = "hot" | "warm" | "nurture" | "cold";

export interface LeadScoreInput {
  moveDate: string | null;            // YYYY-MM-DD (or flexible_from)
  hasEmail: boolean;
  hasPhone: boolean;
  hasOrigin: boolean;
  hasDestination: boolean;            // n/a services count as satisfied
  destinationRequired: boolean;
  bedrooms?: string | null;          // "studio" | "1".."5+"
  serviceType: string;
  source?: string | null;            // derived channel
  createdAt?: Date;                  // enquiry time (defaults now)
  returningCustomer: boolean;
  intent?: "high" | "low" | "neutral"; // from keyword detection on the enquiry text
}

export interface LeadScoreResult {
  score: number;
  band: LeadBand;
  breakdown: Record<string, number>;
}

const BEDROOM_WEIGHT: Record<string, number> = {
  studio: 4, "1": 6, "2": 9, "3": 12, "4": 14, "5+": 15,
};

function bandFor(score: number): LeadBand {
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  if (score >= 40) return "nurture";
  return "cold";
}

/** Hour of day in UK time (0–23) for a given instant. */
function ukHour(d: Date): number {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false }).format(d);
  return parseInt(h, 10) % 24;
}

export function computeLeadScore(input: LeadScoreInput): LeadScoreResult {
  const b: Record<string, number> = {};
  const now = input.createdAt ?? new Date();

  // Move date within 2 weeks.
  if (input.moveDate) {
    const days = Math.ceil((new Date(input.moveDate + "T12:00:00Z").getTime() - now.getTime()) / 86400000);
    if (days >= 0 && days <= 14) b.moveDate = 20;
    else if (days > 14 && days <= 30) b.moveDate = 10;
    else b.moveDate = 0;
  } else {
    b.moveDate = 5; // flexible/unknown date — mild
  }

  // Form completeness.
  const complete = input.hasEmail && input.hasPhone && input.hasOrigin && (!input.destinationRequired || input.hasDestination);
  b.completeness = complete ? 15 : 5;

  // Job size (by bedrooms; services without bedrooms get a mid weight).
  b.jobSize = input.bedrooms ? (BEDROOM_WEIGHT[input.bedrooms] ?? 8) : 8;

  // Time of enquiry — UK business hours (8am–8pm).
  const hour = ukHour(now);
  b.businessHours = hour >= 8 && hour < 20 ? 10 : 4;

  // Traffic source — warm channels score higher than cold/paid-cold.
  const src = (input.source ?? "").toLowerCase();
  if (src.startsWith("referral") || src === "facebook_organic" || src === "google_organic" || src === "search_organic") b.source = 10;
  else if (src === "direct" || src === "website") b.source = 6;
  else b.source = 4; // paid / unknown

  // Returning customer.
  b.returning = input.returningCustomer ? 10 : 0;

  // Language intent (keyword-detected): high-intent enquiries score higher.
  if (input.intent === "high") b.intent = 10;
  else if (input.intent === "low") b.intent = -5;
  else b.intent = 0;

  const score = Math.max(0, Math.min(100, Object.values(b).reduce((a, v) => a + v, 0)));
  return { score, band: bandFor(score), breakdown: b };
}

export const LEAD_BAND_LABELS: Record<LeadBand, string> = {
  hot: "Hot", warm: "Warm", nurture: "Nurture", cold: "Cold",
};

export const LEAD_BAND_COLOURS: Record<LeadBand, string> = {
  hot: "bg-red-100 text-red-700",
  warm: "bg-orange-100 text-orange-700",
  nurture: "bg-blue-100 text-blue-700",
  cold: "bg-slate-100 text-slate-600",
};
