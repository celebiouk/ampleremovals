/**
 * Deterministic quote recommendation (no AI) — a transparent pricing model the
 * admin can accept or tweak. Total = service base + size + distance + extras.
 *
 * Rates live here as a single config; adjust as the business changes. All values
 * are GBP and ex-VAT (VAT is applied separately at invoice time).
 */

export interface QuoteRecommendationInput {
  serviceType: string;
  bedrooms?: string | null;      // "studio" | "1".."5+"
  distanceMiles?: number | null; // origin → destination
  vanType?: string | null;       // man & van
  additionalServices?: {
    packing_services?: boolean;
    packing_materials?: boolean;
    disassemble_furniture?: boolean;
    assemble_furniture?: boolean;
  } | null;
}

export interface QuoteRecommendation {
  total: number;
  breakdown: { label: string; amount: number }[];
  note: string;
}

const round = (n: number) => Math.round(n);

const SERVICE_BASE: Record<string, number> = {
  removals: 150,
  man_and_van: 60,
  house_clearance: 120,
  house_cleaning: 80,
  end_of_tenancy: 140,
};

const PER_BEDROOM: Record<string, number> = {
  removals: 80,
  man_and_van: 40,
  house_clearance: 70,
  house_cleaning: 25,
  end_of_tenancy: 45,
};

const BEDROOM_UNITS: Record<string, number> = {
  studio: 0.5, "1": 1, "2": 2, "3": 3, "4": 4, "5+": 5,
};

const PER_MILE: Record<string, number> = {
  removals: 1.2,
  man_and_van: 1.4,
  house_clearance: 1.0,
  house_cleaning: 0,
  end_of_tenancy: 0,
};

const VAN_FACTOR: Record<string, number> = {
  small: 1, medium: 1.25, large: 1.5, luton: 1.8,
};

const EXTRAS: Record<string, { label: string; amount: number }> = {
  packing_services: { label: "Packing service", amount: 80 },
  packing_materials: { label: "Packing materials", amount: 40 },
  disassemble_furniture: { label: "Furniture disassembly", amount: 40 },
  assemble_furniture: { label: "Furniture assembly", amount: 40 },
};

export function recommendQuote(input: QuoteRecommendationInput): QuoteRecommendation {
  const svc = input.serviceType;
  const breakdown: { label: string; amount: number }[] = [];

  const base = SERVICE_BASE[svc] ?? 100;
  breakdown.push({ label: "Base", amount: base });

  // Size by bedrooms.
  if (input.bedrooms && PER_BEDROOM[svc]) {
    const units = BEDROOM_UNITS[input.bedrooms] ?? 1;
    const size = round(PER_BEDROOM[svc] * units);
    if (size > 0) breakdown.push({ label: `Size (${input.bedrooms} bed)`, amount: size });
  }

  // Distance.
  if (input.distanceMiles && PER_MILE[svc]) {
    const dist = round(input.distanceMiles * PER_MILE[svc]);
    if (dist > 0) breakdown.push({ label: `Distance (${round(input.distanceMiles)} mi)`, amount: dist });
  }

  // Van size factor (man & van).
  let vanMultiplier = 1;
  if (svc === "man_and_van" && input.vanType) {
    vanMultiplier = VAN_FACTOR[input.vanType] ?? 1;
  }

  // Extras.
  for (const [key, on] of Object.entries(input.additionalServices ?? {})) {
    if (on && EXTRAS[key]) breakdown.push(EXTRAS[key]);
  }

  let total = breakdown.reduce((a, b) => a + b.amount, 0);
  if (vanMultiplier !== 1) {
    total = round(total * vanMultiplier);
    breakdown.push({ label: `Van size ×${vanMultiplier}`, amount: 0 });
  }

  return {
    total: round(total),
    breakdown,
    note: "Recommended price (ex-VAT) from distance, size and services. Adjust before sending.",
  };
}
