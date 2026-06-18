/**
 * Deterministic lead signals (no AI):
 *  - intent detection via keyword/phrase matching on the enquiry text
 *  - "difficult access" flag for known awkward postcode areas
 *
 * Crude vs true NLP, but it surfaces ~80% of the value with zero cost/latency.
 */

const HIGH_INTENT = [
  "need to move by", "need to be out", "asap", "as soon as possible", "urgent",
  "this week", "this weekend", "next week", "tomorrow", "already have a buyer",
  "completion date", "exchanged", "moving date is", "must move", "deadline",
  "how soon", "can you do this", "ready to book", "want to book",
];
const LOW_INTENT = [
  "just getting prices", "just looking", "getting some quotes", "shopping around",
  "not sure when", "might need", "thinking about", "no rush", "sometime", "maybe",
  "ballpark", "rough idea", "just curious",
];

export type IntentLevel = "high" | "low" | "neutral";

export function detectIntent(text: string | null | undefined): { level: IntentLevel; matches: string[] } {
  if (!text) return { level: "neutral", matches: [] };
  const t = text.toLowerCase();
  const high = HIGH_INTENT.filter((p) => t.includes(p));
  const low = LOW_INTENT.filter((p) => t.includes(p));
  if (high.length > low.length) return { level: "high", matches: high };
  if (low.length > high.length) return { level: "low", matches: low };
  return { level: "neutral", matches: [] };
}

// Outward-code prefixes that tend to be awkward (city centres / congestion /
// restricted parking). Extend as the team learns their patch.
const DIFFICULT_PREFIXES = [
  "EC", "WC", "W1", "SW1", "E1", "E14", "N1", "SE1", // central London
  "M1", "M2", "M3", "M4",                              // central Manchester
  "B1", "B2", "B3",                                    // central Birmingham
  "LS1", "LS2", "BS1", "BS2", "NG1", "L1", "L2",       // other city centres
  "BA1", "BA2",                                        // Bath (narrow/hilly)
  "BN1",                                               // Brighton centre
];

/** Returns a short access-difficulty note for a postcode, or null. */
export function accessFlag(postcode: string | null | undefined): string | null {
  if (!postcode) return null;
  const pc = postcode.toUpperCase().replace(/\s+/g, "");
  const outward = pc.match(/^[A-Z]{1,2}\d{1,2}[A-Z]?/)?.[0] ?? pc;
  for (const p of DIFFICULT_PREFIXES) {
    if (outward.startsWith(p)) return "City-centre / restricted parking — allow extra time";
  }
  return null;
}
