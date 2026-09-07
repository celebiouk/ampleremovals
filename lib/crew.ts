/**
 * Team & vehicle shown on a quote. A quote states how many movers and vans the
 * customer gets, and carries a reassurance blurb (experience + how items are
 * protected/loaded/unloaded) so they feel confident about what they're paying
 * for. The blurb is an EDITABLE default — admin can tweak it per quote.
 */

export interface VanSize {
  key: string;
  label: string;
  /** Short label for tight spaces (badges, PDFs). */
  short: string;
}

// Internal only (admin can record the actual vehicle). Customers are never shown
// tonnage — they always see the CUSTOMER_VEHICLE phrase below.
export const VAN_SIZES: VanSize[] = [
  { key: "luton", label: "Luton van", short: "Luton" },
  { key: "lorry", label: "Lorry", short: "Lorry" },
];

/** What the customer is told they get — never a tonnage, just the vehicle type. */
export const CUSTOMER_VEHICLE = "Lorry or Luton van";

/** The self-serve / instant-quote default: a 2-man team with one van. */
export const DEFAULT_CREW = { men: 2, vanCount: 1, vanSize: "luton" } as const;

/**
 * Number of vans a move needs, from the total item quantity + whether it includes
 * any white goods (heavy appliances take space):
 *   • with a white good:  2 vans once you're over 65 items
 *   • no white goods:     2 vans once you're over 70 items
 * otherwise a single van.
 */
export function vanCountFor(itemQty: number, hasWhiteGoods: boolean, enabled = true): number {
  if (!enabled) return 1; // admin turned off automatic 2-van sizing
  const n = Math.max(0, Math.floor(itemQty || 0));
  if (hasWhiteGoods && n > 65) return 2;
  if (!hasWhiteGoods && n > 70) return 2;
  return 1;
}

export interface CrewSummary {
  men: number;
  years: number;
  vans: number;
  vehicle: string;
  line: string;
  blurb: string;
}

/**
 * The team & vehicle for a move, by tier + size. Standard = 2 movers (combined
 * 7 years); Premium = 4 movers (combined 11 years). Van count follows
 * `vanCountFor`. This is the single source of truth for the customer-facing crew
 * copy across the quote page, emails and PDF.
 */
export function crewSummary(tier: "standard" | "premium", itemQty: number, hasWhiteGoods: boolean, autoVans = true): CrewSummary {
  const men = tier === "premium" ? 4 : 2;
  const years = tier === "premium" ? 11 : 7;
  const vans = vanCountFor(itemQty, hasWhiteGoods, autoVans);
  const vanPhrase = vans === 1 ? `a ${CUSTOMER_VEHICLE}` : `${vans} vans (${CUSTOMER_VEHICLE})`;
  const line = `${men} professional movers (combined ${years} years) · ${vans} × ${CUSTOMER_VEHICLE}`;
  const blurb =
    `You get ${men} professional movers with a combined ${years} years' experience, and ${vanPhrase} for the job. ` +
    `We treat your belongings like our own: every piece of furniture is protected, and everything is secured with ` +
    `straps in the van so nothing shifts in transit. Our team carefully loads at pickup and, at the drop-off, ` +
    `unloads and places each item exactly where you want it — ready for you to settle straight in.`;
  return { men, years, vans, vehicle: CUSTOMER_VEHICLE, line, blurb };
}

export function vanSizeLabel(key: string | null | undefined): string {
  return VAN_SIZES.find((v) => v.key === key)?.label ?? CUSTOMER_VEHICLE;
}

/**
 * Resolve the crew/vehicle for a booking's quote. Prefers admin-set figures, else
 * the standard house crew. The customer always sees "Lorry or Luton van" (never a
 * tonnage). Blurb falls back to the standard-tier default.
 */
export function resolveCrew(b: {
  quote_crew_men?: number | null;
  quote_van_count?: number | null;
  quote_van_size?: string | null;
  quote_crew_blurb?: string | null;
}): { men: number; vanCount: number; vanSize: string; vanLabel: string; line: string; blurb: string } {
  const men = b.quote_crew_men ?? DEFAULT_CREW.men;
  const vanCount = b.quote_van_count ?? DEFAULT_CREW.vanCount;
  const vanSize = b.quote_van_size ?? DEFAULT_CREW.vanSize;
  const years = men >= 4 ? 11 : 7;
  return {
    men, vanCount, vanSize, vanLabel: CUSTOMER_VEHICLE,
    line: `${men} professional movers (combined ${years} years) · ${vanCount} × ${CUSTOMER_VEHICLE}`,
    blurb: b.quote_crew_blurb || defaultCrewBlurb(men, vanCount, vanSize),
  };
}

/**
 * The default reassurance blurb for a given crew/vehicle. Admin can edit the
 * result; this is only the starting point. Never mentions tonnage or shrink-wrap.
 */
export function defaultCrewBlurb(men: number, vanCount: number, _vanSizeKey?: string): string {
  const menSafe = Math.max(1, men || 1);
  const vans = Math.max(1, vanCount || 1);
  const years = menSafe >= 4 ? 11 : 7;
  const vanPhrase = vans === 1 ? `a ${CUSTOMER_VEHICLE}` : `${vans} vans (${CUSTOMER_VEHICLE})`;
  return (
    `You get a ${menSafe}-strong professional removals team with a combined ${years} years' experience, ` +
    `and ${vanPhrase} for the job. ` +
    `We treat your belongings like our own: every piece of furniture is protected, and everything is secured with ` +
    `straps in the van so nothing shifts in transit. ` +
    `Our team carefully loads at pickup and, at the drop-off, unloads and places each item exactly where you want it — ready for you to settle straight in.`
  );
}
