/**
 * Two-tier pricing shown on the customer quote — Standard vs Premium, inspired by
 * AnyVan. Premium is a fixed multiple of the Standard quote and, when chosen,
 * bundles in full packing, materials and dismantle/reassemble.
 *
 * Change PREMIUM_MULTIPLIER here to tune the Premium price (e.g. 2.2 = +120%).
 */
export const PREMIUM_MULTIPLIER = 2.25;

export const premiumTotalFor = (standardTotal: number): number =>
  Math.round((Number(standardTotal) || 0) * PREMIUM_MULTIPLIER * 100) / 100;

export const STANDARD_INCLUDES: string[] = [
  "Professional team to load, transport & offload",
  "Moving blankets & straps to protect your items",
  "We place items in the right rooms at your new home",
  "Free cancellation window",
];

export const PREMIUM_INCLUDES: string[] = [
  "Everything in Standard, plus:",
  "Unlimited packing — we pack every room, however much you have",
  "All packing materials supplied (boxes, tape, wrap)",
  "Unlimited dismantling & reassembly of your furniture",
  "Priority coordinator for your move",
  "Extended protection cover",
  "Longer wait time included",
];

export const TIER_COPY = {
  standard: { name: "Standard Removal", tagline: "Our team loads, transports and offloads your belongings to your new home." },
  premium: { name: "Premium — Full Pack & Move", tagline: "The complete moving experience — full packing, dismantle & reassembly and move service." },
} as const;

export type QuoteTier = "standard" | "premium";
