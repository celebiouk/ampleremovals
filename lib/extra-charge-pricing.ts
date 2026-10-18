/**
 * Shared auto-pricing for on-site extras (driver app's JobExtraButton and the
 * server-side charges route both call this with the same rates, so the price
 * the driver sees is exactly what gets recorded as `auto_amount`).
 */

export interface ExtraChargeRates {
  itemRate: number;
  stairsRatePerFlight: number;
  distanceFreeMeters: number;
  distanceRatePer10m: number;
}

export type ExtraType = "item" | "stairs" | "distance" | "other";

export interface ExtraChargeInput {
  extraType: ExtraType;
  itemLabel?: string | null;
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

/** Human-readable line for the invoice, admin approvals list, and activity log. */
export function describeExtraCharge(input: ExtraChargeInput, rates: ExtraChargeRates): string {
  switch (input.extraType) {
    case "item":
      return `Extra item: ${input.itemLabel ?? "item"} x${input.quantity ?? 1}`;
    case "stairs":
      return `Extra stairs: ${input.flights ?? 0} flight${(input.flights ?? 0) === 1 ? "" : "s"} beyond ground-floor access`;
    case "distance":
      return `Extra carry distance: ${input.distanceMeters ?? 0}m (beyond the ${rates.distanceFreeMeters}m free allowance)`;
    case "other":
    default:
      return "Other on-site extra";
  }
}
