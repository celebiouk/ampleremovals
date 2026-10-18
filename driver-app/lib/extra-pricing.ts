/**
 * Mirrors lib/extra-charge-pricing.ts in the main repo (can't import across
 * the Metro boundary — see extra-catalog.ts). Used only for the driver's
 * instant preview; the server recomputes `auto_amount` authoritatively on
 * submit, so a mismatch here is a UX nit, never a pricing bug.
 */
import type { ExtraChargeRates } from "@/hooks/queries";

export type ExtraType = "item" | "stairs" | "distance" | "other";

export interface ExtraChargeInput {
  extraType: ExtraType;
  quantity?: number | null;
  flights?: number | null;
  distanceMeters?: number | null;
}

export function calcAutoAmount(input: ExtraChargeInput, rates: ExtraChargeRates): number {
  switch (input.extraType) {
    case "item":
      return Math.round((input.quantity ?? 1) * rates.itemRate * 100) / 100;
    case "stairs":
      return Math.round((input.flights ?? 0) * rates.stairsRatePerFlight * 100) / 100;
    case "distance": {
      const over = Math.max(0, (input.distanceMeters ?? 0) - rates.distanceFreeMeters);
      const bands = Math.ceil(over / 10);
      return Math.round(bands * rates.distanceRatePer10m * 100) / 100;
    }
    case "other":
    default:
      return 0;
  }
}
