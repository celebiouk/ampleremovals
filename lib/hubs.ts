/**
 * The 17 larger service-area hubs that villages/towns nest under for the
 * local-page system (see localvillagesbuildingplan.md). Distances are
 * approximate road-distance from the depot (Cold Ash, nr Newbury, RG18) —
 * real facts, not filler, used directly in page copy so it isn't templated.
 */
export interface Hub {
  slug: string;
  name: string;
  county: string;
  /** Approximate road miles from the Cold Ash depot. */
  depotDistanceMiles: number;
  /** One real, specific local landmark — used in hero/intro copy. */
  landmark: string;
  /** Outward postcode districts this hub covers. */
  postcodes: string[];
}

export const HUBS: Hub[] = [
  { slug: "newbury", name: "Newbury", county: "Berkshire", depotDistanceMiles: 3, landmark: "Newbury Racecourse", postcodes: ["RG14", "RG18", "RG19", "RG20"] },
  { slug: "bath", name: "Bath", county: "Somerset", depotDistanceMiles: 35, landmark: "the Royal Crescent", postcodes: ["BA1", "BA2"] },
  { slug: "oxford", name: "Oxford", county: "Oxfordshire", depotDistanceMiles: 27, landmark: "the Radcliffe Camera", postcodes: ["OX1", "OX2", "OX3", "OX4"] },
  { slug: "reading", name: "Reading", county: "Berkshire", depotDistanceMiles: 16, landmark: "the Oracle shopping centre", postcodes: ["RG1", "RG2", "RG4", "RG6"] },
  { slug: "basingstoke", name: "Basingstoke", county: "Hampshire", depotDistanceMiles: 17, landmark: "Basingstoke Festival Place", postcodes: ["RG21", "RG22", "RG23", "RG24"] },
  { slug: "andover", name: "Andover", county: "Hampshire", depotDistanceMiles: 24, landmark: "Finkley Down Farm", postcodes: ["SP10", "SP11"] },
  { slug: "portsmouth", name: "Portsmouth", county: "Hampshire", depotDistanceMiles: 44, landmark: "the Spinnaker Tower", postcodes: ["PO1", "PO2", "PO3", "PO4", "PO6"] },
  { slug: "chichester", name: "Chichester", county: "West Sussex", depotDistanceMiles: 50, landmark: "Chichester Cathedral", postcodes: ["PO18", "PO19", "PO20"] },
  { slug: "southampton", name: "Southampton", county: "Hampshire", depotDistanceMiles: 36, landmark: "Southampton's city walls", postcodes: ["SO14", "SO15", "SO16", "SO17", "SO18"] },
  { slug: "slough", name: "Slough", county: "Berkshire", depotDistanceMiles: 25, landmark: "the Slough Trading Estate", postcodes: ["SL1", "SL2", "SL3"] },
  { slug: "winchester", name: "Winchester", county: "Hampshire", depotDistanceMiles: 27, landmark: "Winchester Cathedral", postcodes: ["SO21", "SO22", "SO23"] },
  { slug: "bristol", name: "Bristol", county: "Bristol", depotDistanceMiles: 42, landmark: "Clifton Suspension Bridge", postcodes: ["BS1", "BS8", "BS9", "BS16"] },
  { slug: "bracknell", name: "Bracknell", county: "Berkshire", depotDistanceMiles: 22, landmark: "The Lexicon shopping centre", postcodes: ["RG12"] },
  { slug: "swindon", name: "Swindon", county: "Wiltshire", depotDistanceMiles: 25, landmark: "the STEAM railway museum", postcodes: ["SN1", "SN2", "SN3", "SN25"] },
  { slug: "wokingham", name: "Wokingham", county: "Berkshire", depotDistanceMiles: 18, landmark: "Wokingham's Market Place", postcodes: ["RG40", "RG41"] },
  { slug: "salisbury", name: "Salisbury", county: "Wiltshire", depotDistanceMiles: 30, landmark: "Salisbury Cathedral", postcodes: ["SP1", "SP2"] },
  { slug: "wiltshire", name: "Wiltshire", county: "Wiltshire", depotDistanceMiles: 32, landmark: "the Kennet and Avon Canal", postcodes: ["BA14", "SN11", "SN12", "SN13", "SN15"] },
];

export const HUB_MAP: Record<string, Hub> = HUBS.reduce((acc, h) => {
  acc[h.slug] = h;
  return acc;
}, {} as Record<string, Hub>);
