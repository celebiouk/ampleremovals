/**
 * Service locations for Ample Removals
 * Used for generating SEO-optimized location pages
 */

export interface Location {
  slug: string;
  name: string;
  county: string;
  region: string;
  nearbyAreas: string[];
}

export const LOCATIONS: Location[] = [
  // Hampshire
  { slug: "basingstoke", name: "Basingstoke", county: "Hampshire", region: "South East England", nearbyAreas: ["Reading", "Newbury", "Winchester"] },
  { slug: "winchester", name: "Winchester", county: "Hampshire", region: "South East England", nearbyAreas: ["Southampton", "Basingstoke", "Eastleigh"] },
  { slug: "southampton", name: "Southampton", county: "Hampshire", region: "South East England", nearbyAreas: ["Portsmouth", "Winchester", "Eastleigh", "Fareham"] },
  { slug: "portsmouth", name: "Portsmouth", county: "Hampshire", region: "South East England", nearbyAreas: ["Southampton", "Fareham", "Brighton"] },
  { slug: "andover", name: "Andover", county: "Hampshire", region: "South East England", nearbyAreas: ["Basingstoke", "Winchester", "Salisbury"] },
  { slug: "fareham", name: "Fareham", county: "Hampshire", region: "South East England", nearbyAreas: ["Portsmouth", "Southampton", "Gosport"] },
  { slug: "eastleigh", name: "Eastleigh", county: "Hampshire", region: "South East England", nearbyAreas: ["Southampton", "Winchester", "Romsey"] },

  // London
  { slug: "london", name: "London", county: "Greater London", region: "London", nearbyAreas: ["Slough", "Guildford", "Woking", "Reading"] },

  // Berkshire
  { slug: "newbury", name: "Newbury", county: "Berkshire", region: "South East England", nearbyAreas: ["Reading", "Basingstoke", "Swindon", "Thatcham"] },
  { slug: "thatcham", name: "Thatcham", county: "Berkshire", region: "South East England", nearbyAreas: ["Newbury", "Reading", "Basingstoke"] },
  { slug: "reading", name: "Reading", county: "Berkshire", region: "South East England", nearbyAreas: ["Newbury", "Slough", "High Wycombe", "Oxford"] },
  { slug: "slough", name: "Slough", county: "Berkshire", region: "South East England", nearbyAreas: ["Reading", "London", "High Wycombe"] },

  // Oxfordshire
  { slug: "oxford", name: "Oxford", county: "Oxfordshire", region: "South East England", nearbyAreas: ["Reading", "Swindon", "Milton Keynes"] },

  // Surrey
  { slug: "guildford", name: "Guildford", county: "Surrey", region: "South East England", nearbyAreas: ["Woking", "London", "Crawley"] },
  { slug: "woking", name: "Woking", county: "Surrey", region: "South East England", nearbyAreas: ["Guildford", "London", "Slough"] },

  // Wiltshire
  { slug: "swindon", name: "Swindon", county: "Wiltshire", region: "South West England", nearbyAreas: ["Oxford", "Reading", "Bristol", "Bath"] },

  // Bristol
  { slug: "bristol", name: "Bristol", county: "Bristol", region: "South West England", nearbyAreas: ["Bath", "Swindon", "Gloucester", "Cheltenham"] },

  // Buckinghamshire
  { slug: "milton-keynes", name: "Milton Keynes", county: "Buckinghamshire", region: "South East England", nearbyAreas: ["Oxford", "High Wycombe", "Reading"] },
  { slug: "high-wycombe", name: "High Wycombe", county: "Buckinghamshire", region: "South East England", nearbyAreas: ["Reading", "Slough", "Milton Keynes"] },

  // Somerset
  { slug: "bath", name: "Bath", county: "Somerset", region: "South West England", nearbyAreas: ["Bristol", "Swindon", "Taunton"] },
  { slug: "taunton", name: "Taunton", county: "Somerset", region: "South West England", nearbyAreas: ["Bath", "Exeter", "Bristol"] },

  // Dorset
  { slug: "bournemouth", name: "Bournemouth", county: "Dorset", region: "South West England", nearbyAreas: ["Poole", "Southampton", "Salisbury"] },
  { slug: "poole", name: "Poole", county: "Dorset", region: "South West England", nearbyAreas: ["Bournemouth", "Southampton"] },
  { slug: "salisbury", name: "Salisbury", county: "Wiltshire", region: "South West England", nearbyAreas: ["Southampton", "Andover", "Bournemouth"] },

  // Gloucestershire
  { slug: "gloucester", name: "Gloucester", county: "Gloucestershire", region: "South West England", nearbyAreas: ["Cheltenham", "Bristol", "Swindon"] },
  { slug: "cheltenham", name: "Cheltenham", county: "Gloucestershire", region: "South West England", nearbyAreas: ["Gloucester", "Bristol", "Oxford"] },

  // Devon
  { slug: "exeter", name: "Exeter", county: "Devon", region: "South West England", nearbyAreas: ["Plymouth", "Taunton", "Bristol"] },
  { slug: "plymouth", name: "Plymouth", county: "Devon", region: "South West England", nearbyAreas: ["Exeter", "Bournemouth"] },

  // Kent
  { slug: "maidstone", name: "Maidstone", county: "Kent", region: "South East England", nearbyAreas: ["Canterbury", "London", "Brighton"] },
  { slug: "canterbury", name: "Canterbury", county: "Kent", region: "South East England", nearbyAreas: ["Maidstone", "London"] },

  // Sussex
  { slug: "brighton", name: "Brighton", county: "East Sussex", region: "South East England", nearbyAreas: ["Portsmouth", "Crawley", "London"] },
  { slug: "crawley", name: "Crawley", county: "West Sussex", region: "South East England", nearbyAreas: ["Brighton", "Guildford", "London"] },
];

export const LOCATION_MAP = LOCATIONS.reduce((acc, loc) => {
  acc[loc.slug] = loc;
  return acc;
}, {} as Record<string, Location>);

// SEO keywords for different services
export const SERVICE_KEYWORDS = {
  removals: [
    "house removals",
    "home removals",
    "removal company",
    "removal services",
    "house moving",
    "home movers",
    "moving company",
    "furniture removals",
    "domestic removals",
    "residential removals",
    "office removals",
    "business removals",
    "commercial removals",
    "professional movers",
  ],
  man_and_van: [
    "man and van",
    "man with van",
    "van hire with driver",
    "small removals",
    "single item delivery",
    "furniture delivery",
    "van removal service",
  ],
  house_clearance: [
    "house clearance",
    "property clearance",
    "home clearance",
    "estate clearance",
    "rubbish removal",
    "waste clearance",
    "full house clearance",
  ],
  house_cleaning: [
    "house cleaning",
    "home cleaning",
    "domestic cleaning",
    "deep cleaning",
    "professional cleaning",
    "cleaning service",
  ],
  end_of_tenancy: [
    "end of tenancy cleaning",
    "tenancy cleaning",
    "move out cleaning",
    "landlord cleaning",
    "rental property cleaning",
    "checkout cleaning",
  ],
};
