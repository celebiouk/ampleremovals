/**
 * Ample Removals' delivery/collection subcontracting service
 * (ampleremovals.com/logistics) — a one-Luton-van offer to local
 * businesses, and the lead-gen CRM behind it. See tasks/todo.md,
 * "Ample Logistics B2B lead-gen + Gmail outreach engine".
 */

export const DELIVERY_LEADS = {
  notifyEmail: "daniel@ampleremovals.com",
  gmailAddress: "daniel@ampleremovals.com",
  searchCentres: [
    { slug: "thatcham", label: "Thatcham", postcode: "RG19" },
    { slug: "newbury", label: "Newbury", postcode: "RG14" },
  ],
  searchRadiusMiles: 20,
} as const;

export type DeliveryLeadCategory =
  | "furniture_retailer"
  | "appliance_retailer"
  | "office_furniture_supplier"
  | "kitchen_bathroom_supplier"
  | "courier"
  | "logistics_partner"
  | "warehouse_distributor"
  | "ecommerce"
  | "self_storage"
  | "event_equipment_supplier"
  | "other";

export const DELIVERY_LEAD_CATEGORY_LABELS: Record<DeliveryLeadCategory, string> = {
  furniture_retailer: "Furniture Retailer",
  appliance_retailer: "Appliance Retailer",
  office_furniture_supplier: "Office Furniture Supplier",
  kitchen_bathroom_supplier: "Kitchen & Bathroom Supplier",
  courier: "Courier Company",
  logistics_partner: "Logistics Partner",
  warehouse_distributor: "Warehouse / Distributor",
  ecommerce: "E-commerce Business",
  self_storage: "Self-Storage Business",
  event_equipment_supplier: "Event Equipment Supplier",
  other: "Other Commercial Customer",
};

/**
 * Category priority weighting for scoring — Priority A (retailers) score
 * highest since they tend to need recurring bulky-item delivery, which
 * suits one Luton van; Priority C is more speculative.
 */
const CATEGORY_SCORE: Record<DeliveryLeadCategory, number> = {
  furniture_retailer: 30,
  appliance_retailer: 28,
  office_furniture_supplier: 24,
  kitchen_bathroom_supplier: 24,
  courier: 26,
  logistics_partner: 24,
  warehouse_distributor: 22,
  ecommerce: 20,
  self_storage: 16,
  event_equipment_supplier: 16,
  other: 10,
};

/**
 * Business name/category keywords that must NEVER be contacted — removal,
 * man-and-van, house clearance, and moving companies are Ample Removals'
 * own competitors/peers, not delivery-subcontracting prospects.
 */
const EXCLUDED_KEYWORDS = [
  "removal",
  "removals",
  "man and van",
  "man & van",
  "house clearance",
  "moving company",
  "movers",
  "relocation",
  "furniture removal",
];

export function isExcludedBusiness(name: string, category?: string | null): { excluded: boolean; reason?: string } {
  const haystack = `${name} ${category ?? ""}`.toLowerCase();
  for (const kw of EXCLUDED_KEYWORDS) {
    if (haystack.includes(kw)) {
      return { excluded: true, reason: `matched excluded keyword "${kw}"` };
    }
  }
  return { excluded: false };
}

export type DeliveryLeadBand = "hot" | "warm" | "nurture" | "cold";

export interface DeliveryLeadScoreInput {
  category: DeliveryLeadCategory;
  distanceMiles: number | null;
  hasEmail: boolean;
  hasWebsite: boolean;
  hasPhone: boolean;
  capacityCompatible: boolean;
}

export interface DeliveryLeadScoreResult {
  score: number;
  band: DeliveryLeadBand;
  breakdown: Record<string, number>;
}

function bandFor(score: number): DeliveryLeadBand {
  if (score >= 70) return "hot";
  if (score >= 50) return "warm";
  if (score >= 30) return "nurture";
  return "cold";
}

/** 0–100 lead score — category fit, distance, contactability, one-van capacity fit. */
export function scoreDeliveryLead(input: DeliveryLeadScoreInput): DeliveryLeadScoreResult {
  const b: Record<string, number> = {};

  b.category = CATEGORY_SCORE[input.category] ?? CATEGORY_SCORE.other;

  if (input.distanceMiles == null) b.distance = 5;
  else if (input.distanceMiles <= 5) b.distance = 20;
  else if (input.distanceMiles <= 10) b.distance = 15;
  else if (input.distanceMiles <= 15) b.distance = 10;
  else b.distance = 5;

  b.contactability = (input.hasEmail ? 15 : 0) + (input.hasWebsite ? 5 : 0) + (input.hasPhone ? 5 : 0);

  b.capacity = input.capacityCompatible ? 25 : 0;

  const score = Math.min(100, Object.values(b).reduce((a, v) => a + v, 0));
  return { score, band: bandFor(score), breakdown: b };
}

export type DeliveryLeadStatus =
  | "discovered"
  | "qualified"
  | "queued"
  | "contacted"
  | "followed_up"
  | "interested"
  | "pricing_requested"
  | "not_interested"
  | "unsubscribed"
  | "converted";

export const DELIVERY_LEAD_STATUS_LABELS: Record<DeliveryLeadStatus, string> = {
  discovered: "Discovered",
  qualified: "Qualified",
  queued: "Queued",
  contacted: "Contacted",
  followed_up: "Followed Up",
  interested: "Interested",
  pricing_requested: "Pricing Requested",
  not_interested: "Not Interested",
  unsubscribed: "Unsubscribed",
  converted: "Converted",
};

export interface DeliveryLead {
  id: string;
  businessName: string;
  category: DeliveryLeadCategory;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postcode: string | null;
  searchCentre: string | null;
  distanceMiles: number | null;
  source: string;
  discoveredAt: string;
  score: number;
  band: DeliveryLeadBand;
  estJobsPerWeek: string | null;
  deliveryFrequency: string | null;
  requiredVehicleType: string | null;
  requiredStaffCount: string | null;
  distancePerJob: string | null;
  estTimePerJob: string | null;
  potentialContractValue: string | null;
  capacityCompatible: boolean;
  capacityNotes: string | null;
  excluded: boolean;
  excludedReason: string | null;
  status: DeliveryLeadStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}
