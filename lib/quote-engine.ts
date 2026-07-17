/**
 * Instant customer-facing quote engine (Removals only, for now).
 *
 * Deterministic, no AI. Produces the line items the CUSTOMER sees plus the total
 * and the 25% deposit. This is intentionally separate from
 * `lib/quote-recommendation.ts` (an admin-side estimator with different rates):
 * this one encodes the owner's published pricing that customers are quoted and
 * can act on directly.
 *
 * Man & Van is deliberately NOT auto-quoted yet — it keeps the existing manual
 * flow until the owner confirms van-size pricing.
 *
 * Pricing rules (confirmed with the owner):
 *  - Removals base is by bedroom band. Having ANY white goods adds a FLAT £50 —
 *    folded INTO the base line so the customer never sees the uplift as its own
 *    row and cannot remove it.
 *  - Packing: £35 / hour × hours the customer selects.
 *  - Dismantling: £20 / item × quantity.
 *  - Assembling: £20 / item × quantity.
 *  - End-of-tenancy cleaning add-on: by bedroom band.
 *  - Deposit: 25% of the total.
 *
 * White-goods uplift and the base price are NOT removable. Packing, dismantling,
 * assembling and cleaning ARE removable (customer can ✕ them off the quote, and
 * we recompute).
 */

import type { QuoteLineItem } from "@/types";

/** A quote line the customer sees. Extends the stored QuoteLineItem with a
 *  stable key (for removal) and whether the customer may remove it. */
export interface QuoteLine extends QuoteLineItem {
  key: string;
  removable: boolean;
}

export interface QuoteEngineInput {
  /** Removals: "studio" | "1" | "2" | "3" | "4" | "5+" */
  bedrooms?: string | null;
  /** True if the inventory includes any white good (fridge freezer, washing
   *  machine, tumble dryer, dishwasher, chest freezer). Adds a hidden +£50. */
  hasWhiteGoods?: boolean;
  /** Hours of packing help requested (£35/hr). */
  packingHours?: number;
  /** Number of items to dismantle (£20 each). */
  dismantleCount?: number;
  /** Number of items to assemble (£20 each). */
  assembleCount?: number;
  /** End-of-tenancy cleaning add-on (priced by bedroom band). */
  eotCleaning?: boolean;
}

export interface QuoteEngineResult {
  lines: QuoteLine[];
  total: number;
  /** 25% deposit, rounded to the penny. */
  depositAmount: number;
}

/* ── Rates (single source of truth — adjust as the business changes) ──────── */

/** Deposit is 25% of the total. */
export const DEPOSIT_RATE = 0.25;

/** Flat uplift when the move includes any white goods (hidden from the customer). */
export const WHITE_GOODS_UPLIFT = 50;

/** Removals base price by bedroom band, WITHOUT white goods (the +£50 is added
 *  on top when applicable). Confirmed table. */
const REMOVALS_BASE: Record<string, number> = {
  studio: 400,
  "1": 450,
  "2": 500,
  "3": 550,
  "4": 600,
  "5+": 650,
};

/** Packing help, per hour. */
export const PACKING_PER_HOUR = 35;

/** Dismantling / assembling, per item. */
export const DISMANTLE_PER_ITEM = 20;
export const ASSEMBLE_PER_ITEM = 20;

/**
 * End-of-tenancy cleaning add-on by bedroom band.
 * Owner gave 2-bed £200 and 3-bed £250 (+£50 per extra bedroom). Studio/1-bed and
 * 4/5+ extrapolated — confirm before launch.
 */
const EOT_CLEANING_BY_BEDROOM: Record<string, number> = {
  studio: 100,
  "1": 150,
  "2": 200,
  "3": 250,
  "4": 300,
  "5+": 350,
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const bedroomLabel = (bedrooms: string): string =>
  bedrooms === "studio" ? "Studio" : bedrooms === "5+" ? "5+ bedroom" : `${bedrooms} bedroom`;

/**
 * Build the customer-facing quote. Unknown/missing size inputs fall back to the
 * smallest band so a quote is always produced (never a £0 or NaN quote).
 */
export function buildQuote(input: QuoteEngineInput): QuoteEngineResult {
  const lines: QuoteLine[] = [];

  // 1. Base move price (not removable). White-goods uplift folded in silently.
  const bedrooms = input.bedrooms && input.bedrooms in REMOVALS_BASE ? input.bedrooms : "1";
  const base = REMOVALS_BASE[bedrooms] + (input.hasWhiteGoods ? WHITE_GOODS_UPLIFT : 0);
  lines.push({
    key: "base",
    description: `Removals — ${bedroomLabel(bedrooms)}`,
    quantity: 1,
    unit_price: base,
    total: base,
    removable: false,
  });

  // 2. Packing help (£35/hr) — removable.
  const packingHours = Math.max(0, Math.floor(input.packingHours ?? 0));
  if (packingHours > 0) {
    lines.push({
      key: "packing",
      description: `Packing help (${packingHours} hour${packingHours === 1 ? "" : "s"})`,
      quantity: packingHours,
      unit_price: PACKING_PER_HOUR,
      total: packingHours * PACKING_PER_HOUR,
      removable: true,
    });
  }

  // 3. Dismantling (£20/item) — removable.
  const dismantleCount = Math.max(0, Math.floor(input.dismantleCount ?? 0));
  if (dismantleCount > 0) {
    lines.push({
      key: "dismantle",
      description: `Furniture dismantling (${dismantleCount} item${dismantleCount === 1 ? "" : "s"})`,
      quantity: dismantleCount,
      unit_price: DISMANTLE_PER_ITEM,
      total: dismantleCount * DISMANTLE_PER_ITEM,
      removable: true,
    });
  }

  // 4. Assembling (£20/item) — removable.
  const assembleCount = Math.max(0, Math.floor(input.assembleCount ?? 0));
  if (assembleCount > 0) {
    lines.push({
      key: "assemble",
      description: `Furniture assembling (${assembleCount} item${assembleCount === 1 ? "" : "s"})`,
      quantity: assembleCount,
      unit_price: ASSEMBLE_PER_ITEM,
      total: assembleCount * ASSEMBLE_PER_ITEM,
      removable: true,
    });
  }

  // 5. End-of-tenancy cleaning (by bedroom band) — removable.
  if (input.eotCleaning) {
    const bedrooms = input.bedrooms && input.bedrooms in EOT_CLEANING_BY_BEDROOM ? input.bedrooms : "1";
    const price = EOT_CLEANING_BY_BEDROOM[bedrooms];
    lines.push({
      key: "eot_cleaning",
      description: `End-of-tenancy cleaning — ${bedroomLabel(bedrooms)}`,
      quantity: 1,
      unit_price: price,
      total: price,
      removable: true,
    });
  }

  const total = round2(lines.reduce((sum, l) => sum + l.total, 0));
  const depositAmount = round2(total * DEPOSIT_RATE);

  return { lines, total, depositAmount };
}

/**
 * Recompute a quote after the customer removes one or more removable lines.
 * `removedKeys` are the line keys the customer ✕'d off. The base line can never
 * be removed, so it is always retained.
 */
export function recomputeQuote(
  input: QuoteEngineInput,
  removedKeys: string[]
): QuoteEngineResult {
  const removed = new Set(removedKeys.filter((k) => k !== "base"));
  const full = buildQuote(input);
  const lines = full.lines.filter((l) => !removed.has(l.key));
  const total = round2(lines.reduce((sum, l) => sum + l.total, 0));
  return { lines, total, depositAmount: round2(total * DEPOSIT_RATE) };
}
