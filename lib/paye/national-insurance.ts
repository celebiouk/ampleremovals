/**
 * Class 1 National Insurance (category A), weekly.
 * Regular employees: per-period method against weekly thresholds.
 * Directors: annual (cumulative) method against annual thresholds.
 *
 * v1 supports category A only; other categories (B, C, H, M, V, Z…) are a
 * documented follow-up — the UI restricts to A for now.
 */

import type { PayeRates } from "./rates";

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface NiInput {
  grossThisPeriod: number;
  ytdGross: number; // NI-able pay to date (before this period) — directors only
  ytdEmployeeNi: number;
  ytdEmployerNi: number;
  isDirector: boolean;
  rates: PayeRates;
}

export interface NiResult {
  employee: number;
  employer: number;
}

export function calculateNI(input: NiInput): NiResult {
  const { grossThisPeriod, isDirector, rates } = input;
  const ni = rates.ni;

  if (isDirector) {
    // Annual cumulative method.
    const cumGross = input.ytdGross + grossThisPeriod;
    const a = ni.annual;
    const cumEE = round2(
      Math.max(0, Math.min(cumGross, a.UEL) - a.PT) * ni.employeeMainRate +
        Math.max(0, cumGross - a.UEL) * ni.employeeUpperRate
    );
    const cumER = round2(Math.max(0, cumGross - a.ST) * ni.employerRate);
    return {
      employee: round2(cumEE - input.ytdEmployeeNi),
      employer: round2(cumER - input.ytdEmployerNi),
    };
  }

  // Per-period (weekly) method.
  const w = ni.weekly;
  const employee = round2(
    Math.max(0, Math.min(grossThisPeriod, w.UEL) - w.PT) * ni.employeeMainRate +
      Math.max(0, grossThisPeriod - w.UEL) * ni.employeeUpperRate
  );
  const employer = round2(Math.max(0, grossThisPeriod - w.ST) * ni.employerRate);
  return { employee, employer };
}
