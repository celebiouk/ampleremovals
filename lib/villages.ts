/**
 * Villages/towns nested under a hub (see lib/hubs.ts). Populated in batches
 * of 5 per localvillagesbuildingplan.md — not all ~165 exist here yet.
 *
 * Every field below is either a real geographic fact (postcode, lat/lng,
 * nearbyVillages) or genuinely written per village (`character`,
 * `accessNote`) — never a name templated into a fixed sentence. `character`
 * and `accessNote` presence/wording is deliberately NOT formulaic between
 * entries — see the build plan's §3c on varying module presence.
 */
export interface Village {
  slug: string;
  name: string;
  hubSlug: string;
  postcode: string;
  lat: number;
  lng: number;
  /** A genuinely-written local-flavour line — never templated. */
  character: string;
  /** 2-4 slugs of nearby villages that actually have pages (for real hyperlinks). */
  nearbyVillages: string[];
  /** Only present where a real, specific access quirk exists — varies page to page. */
  accessNote?: string;
}

export const VILLAGES: Village[] = [
  // ── Newbury (Berkshire) — batch 1 ──────────────────────────────────────
  {
    slug: "wash-common",
    name: "Wash Common",
    hubSlug: "newbury",
    postcode: "RG14",
    lat: 51.388,
    lng: -1.339,
    character: "A hillside residential suburb immediately south of Newbury town centre — mostly Victorian and Edwardian terraces and semis, with Newbury Showground just down the hill.",
    nearbyVillages: ["speen", "greenham"],
    accessNote: "A lot of Wash Common's streets are Victorian terraces with permit parking and no front driveway — if that's your road, tell us when you book so we can plan the van's parking spot in advance.",
  },
  {
    slug: "speen",
    name: "Speen",
    hubSlug: "newbury",
    postcode: "RG14",
    lat: 51.408,
    lng: -1.345,
    character: "A village on Newbury's western edge, backing onto Snelsmore Common — a mix of older cottages around the original village and newer estates built out toward Donnington.",
    nearbyVillages: ["wash-common", "donnington", "cold-ash"],
  },
  {
    slug: "donnington",
    name: "Donnington",
    hubSlug: "newbury",
    postcode: "RG14",
    lat: 51.415,
    lng: -1.323,
    character: "Just north of Newbury, overlooked by the ruins of 14th-century Donnington Castle — a village of older cottages close to the centre and newer housing further out toward Donnington Grove.",
    nearbyVillages: ["speen", "cold-ash"],
  },
  {
    slug: "greenham",
    name: "Greenham",
    hubSlug: "newbury",
    postcode: "RG19",
    lat: 51.38,
    lng: -1.3,
    character: "South-east of Newbury around the former Greenham Common airbase, now open common land and a business park — home to a mix of established housing and newer developments near Sandleford.",
    nearbyVillages: ["wash-common"],
  },
  {
    slug: "cold-ash",
    name: "Cold Ash",
    hubSlug: "newbury",
    postcode: "RG18",
    lat: 51.433,
    lng: -1.3,
    character: "A ridge-top village between Newbury and Thatcham — this is literally where our depot is, so Cold Ash jobs are usually the quickest we can get a van to.",
    nearbyVillages: ["donnington", "speen"],
    accessNote: "Several of Cold Ash's lanes are narrow and rural with passing places rather than full two-way width — nothing our vans can't handle, just worth knowing if you're expecting a large lorry.",
  },
];

export const VILLAGE_MAP: Record<string, Village> = VILLAGES.reduce((acc, v) => {
  acc[v.slug] = v;
  return acc;
}, {} as Record<string, Village>);

export function villagesForHub(hubSlug: string): Village[] {
  return VILLAGES.filter((v) => v.hubSlug === hubSlug);
}
