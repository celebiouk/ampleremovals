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

  // ── Newbury (Berkshire) — batch 3, completing the hub ──────────────────
  {
    slug: "chieveley",
    name: "Chieveley",
    hubSlug: "newbury",
    postcode: "RG20",
    lat: 51.449,
    lng: -1.311,
    character: "A village just north of Newbury at the M4's Junction 13, best known locally for Chieveley services — the village itself is a quieter mix of stone and brick cottages around the church.",
    nearbyVillages: ["donnington", "cold-ash"],
    accessNote: "Being right by the M4 junction, Chieveley's actually one of the quickest villages for us to reach regardless of traffic through Newbury town centre.",
  },
  {
    slug: "shaw",
    name: "Shaw",
    hubSlug: "newbury",
    postcode: "RG14",
    lat: 51.408,
    lng: -1.313,
    character: "Shaw-cum-Donnington on Newbury's northern edge — a mix of the original village around Shaw House (an Elizabethan manor) and the housing estates built out from it since.",
    nearbyVillages: ["donnington", "speen"],
  },
  {
    slug: "west-mills",
    name: "West Mills",
    hubSlug: "newbury",
    postcode: "RG14",
    lat: 51.401,
    lng: -1.329,
    character: "The old wharf end of Newbury town centre, where the Kennet and Avon Canal meets the River Kennet — converted mill buildings and waterside cottages a short walk from the high street.",
    nearbyVillages: ["wash-common", "newbury-racecourse"],
    accessNote: "West Mills' lanes are narrow and close to the canal towpath, with limited resident parking — let us know your exact road and we'll plan where the van sits.",
  },
  {
    slug: "newbury-racecourse",
    name: "Newbury Racecourse",
    hubSlug: "newbury",
    postcode: "RG14",
    lat: 51.391,
    lng: -1.316,
    character: "The area around Newbury Racecourse itself, which has its own train station — housing here is mostly newer-build estates that have grown up around the racecourse site over the last couple of decades.",
    nearbyVillages: ["west-mills", "greenham"],
  },
  {
    slug: "enborne",
    name: "Enborne",
    hubSlug: "newbury",
    postcode: "RG20",
    lat: 51.374,
    lng: -1.341,
    character: "A small, scattered village south-west of Newbury along the Enborne valley — mostly farmhouses, converted barns and a handful of newer homes, with Newbury's edge only a few minutes away.",
    nearbyVillages: ["wash-common", "greenham"],
    accessNote: "A fair few properties out here are down long private tracks or farm lanes — tell us about your access and we'll make sure the right size van turns up.",
  },

  // ── Bath (Somerset) — batch 2 ──────────────────────────────────────────
  {
    slug: "bathampton",
    name: "Bathampton",
    hubSlug: "bath",
    postcode: "BA2",
    lat: 51.39,
    lng: -2.326,
    character: "A canal-side village just east of Bath, strung along the Kennet and Avon towpath — popular with walkers heading out from the city, with the George Inn as its anchor.",
    nearbyVillages: ["batheaston", "combe-down"],
  },
  {
    slug: "combe-down",
    name: "Combe Down",
    hubSlug: "bath",
    postcode: "BA2",
    lat: 51.357,
    lng: -2.335,
    character: "A hilltop suburb south of Bath, built over the old stone mines that quarried the Bath stone the city itself is built from — now mostly quiet residential streets and the start of the Bath Skyline walk.",
    nearbyVillages: ["bathampton"],
    accessNote: "Combe Down's streets climb steeply and some are narrower former mine-access roads — tell us if your road has tight turns so we bring the right size van.",
  },
  {
    slug: "batheaston",
    name: "Batheaston",
    hubSlug: "bath",
    postcode: "BA1",
    lat: 51.403,
    lng: -2.317,
    character: "On the north bank of the Avon two miles from Bath, a mix of older village core around the church and newer estates toward Northend.",
    nearbyVillages: ["bathampton"],
  },
  {
    slug: "bradford-on-avon",
    name: "Bradford-on-Avon",
    hubSlug: "bath",
    postcode: "BA15",
    lat: 51.347,
    lng: -2.251,
    character: "A historic wool town on a steep valley side, with a Saxon church, a medieval tithe barn, and the Kennet and Avon Canal running through the middle of it.",
    nearbyVillages: ["keynsham"],
    accessNote: "The town centre around the bridge has narrow, steep streets with limited loading access — worth a quick call ahead if you're in that part of town.",
  },
  {
    slug: "keynsham",
    name: "Keynsham",
    hubSlug: "bath",
    postcode: "BS31",
    lat: 51.415,
    lng: -2.494,
    character: "Sitting almost exactly halfway between Bath and Bristol on the River Avon — once known for its Cadbury's chocolate factory, now mostly a commuter town for both cities.",
    nearbyVillages: ["bradford-on-avon"],
  },
];

export const VILLAGE_MAP: Record<string, Village> = VILLAGES.reduce((acc, v) => {
  acc[v.slug] = v;
  return acc;
}, {} as Record<string, Village>);

export function villagesForHub(hubSlug: string): Village[] {
  return VILLAGES.filter((v) => v.hubSlug === hubSlug);
}
