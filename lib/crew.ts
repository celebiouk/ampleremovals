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

export const VAN_SIZES: VanSize[] = [
  { key: "3.5t_luton", label: "3.5 tonne Luton van", short: "3.5t Luton" },
  { key: "7.5t_lorry", label: "7.5 tonne lorry", short: "7.5t lorry" },
  { key: "transit", label: "Transit van", short: "Transit" },
  { key: "large_transit", label: "Large / LWB Transit van", short: "LWB Transit" },
];

/** The self-serve / instant-quote default: a 2-man team with one 3.5t Luton. */
export const DEFAULT_CREW = { men: 2, vanCount: 1, vanSize: "3.5t_luton" } as const;

export function vanSizeLabel(key: string | null | undefined): string {
  return VAN_SIZES.find((v) => v.key === key)?.label ?? "van";
}

/**
 * Resolve the crew/vehicle for a booking's quote, applying the house default
 * (2 men, one 3.5t Luton) and generated blurb when nothing is set — so the team
 * copy appears on EVERY quote (PDF + email), whoever filled the form.
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
  const vanLabel = vanSizeLabel(vanSize);
  return {
    men, vanCount, vanSize, vanLabel,
    line: `${men}-man team · ${vanCount} × ${vanLabel}`,
    blurb: b.quote_crew_blurb || defaultCrewBlurb(men, vanCount, vanSize),
  };
}

/** Rough "combined years of experience" for the blurb — ~3.5 yrs per mover
 *  (so a 2-man team reads "a combined 7 years", matching the house style). */
function combinedYears(men: number): number {
  return Math.max(2, Math.round(men * 3.5));
}

/**
 * The default reassurance blurb for a given crew/vehicle. Admin can edit the
 * result; this is only the starting point.
 */
export function defaultCrewBlurb(men: number, vanCount: number, vanSizeKey: string): string {
  const menSafe = Math.max(1, men || 1);
  const vans = Math.max(1, vanCount || 1);
  const size = vanSizeLabel(vanSizeKey);
  const years = combinedYears(menSafe);
  const vanPhrase = `${vans} ${size}${vans > 1 ? "s" : ""}`;
  return (
    `You get a ${menSafe}-man professional removals team with a combined ${years} years' experience, ` +
    `and ${vanPhrase} for the job. ` +
    `We treat your belongings like our own: every item is wrapped and padded with moving blankets, ` +
    `furniture is protected with shrink-wrap and corner guards, and everything is secured with straps in the van so nothing shifts in transit. ` +
    `Our team carefully loads and, at the drop-off, unloads and places each item exactly where you want it — ready for you to settle straight in.`
  );
}
