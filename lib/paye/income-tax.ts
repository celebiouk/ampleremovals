/**
 * PAYE income tax — HMRC "exact percentage" method (England/NI), weekly.
 * Supports cumulative and week1/month1 (non-cumulative) bases and the common
 * tax-code types. K codes are handled with the 50% regulatory cap; Scottish/
 * Welsh (S/C) codes are out of v1 scope.
 */

import { WEEKS_PER_YEAR, type PayeRates } from "./rates";

const floor2 = (n: number) => Math.floor(n * 100) / 100; // tax rounded down to the penny
const ceil2 = (n: number) => Math.ceil(n * 100) / 100; // free pay rounded up to the penny

export interface TaxCode {
  kind: "allowance" | "K" | "BR" | "D0" | "D1" | "NT" | "0T";
  allowanceAnnual: number; // standard free pay (negative for K)
  weekOne: boolean; // W1/M1/X — non-cumulative
}

export function parseTaxCode(raw: string): TaxCode {
  const code = (raw || "1257L").toUpperCase().replace(/\s+/g, "");
  const weekOne = /(W1|M1|X)$/.test(code);
  const base = code.replace(/(W1|M1|X)$/, "").replace(/^[SC]/, ""); // strip basis + S/C prefix

  if (base === "BR") return { kind: "BR", allowanceAnnual: 0, weekOne };
  if (base === "D0") return { kind: "D0", allowanceAnnual: 0, weekOne };
  if (base === "D1") return { kind: "D1", allowanceAnnual: 0, weekOne };
  if (base === "NT") return { kind: "NT", allowanceAnnual: 0, weekOne };
  if (base === "0T") return { kind: "0T", allowanceAnnual: 0, weekOne };

  const kMatch = base.match(/^K(\d+)$/);
  if (kMatch) return { kind: "K", allowanceAnnual: -(parseInt(kMatch[1], 10) * 10 + 9), weekOne };

  const lMatch = base.match(/^(\d+)[LMNT]?$/);
  const num = lMatch ? parseInt(lMatch[1], 10) : 1257;
  return { kind: "allowance", allowanceAnnual: num * 10 + 9, weekOne };
}

export interface IncomeTaxInput {
  grossThisPeriod: number;
  ytdGross: number; // taxable pay to date BEFORE this period
  ytdTax: number; // tax deducted to date BEFORE this period
  taxCode: string;
  periodNo: number; // tax week 1–52
  rates: PayeRates;
  forceWeekOne?: boolean; // employee on a week1/month1 (non-cumulative) basis
}

/** Returns the income tax for THIS period (can be negative = refund on a cumulative code). */
export function calculateIncomeTax(input: IncomeTaxInput): number {
  const { grossThisPeriod, ytdGross, ytdTax, periodNo, rates } = input;
  const it = rates.incomeTax;
  const tc = parseTaxCode(input.taxCode);
  const weekOne = tc.weekOne || !!input.forceWeekOne;

  if (tc.kind === "NT") return 0;

  // Flat-rate codes are applied per-period (not cumulative).
  if (tc.kind === "BR") return floor2(grossThisPeriod * it.basicRate);
  if (tc.kind === "D0") return floor2(grossThisPeriod * it.higherRate);
  if (tc.kind === "D1") return floor2(grossThisPeriod * it.additionalRate);

  // Cumulative (or week1) banded calculation.
  const n = weekOne ? 1 : periodNo;
  const priorGross = weekOne ? 0 : ytdGross;
  const priorTax = weekOne ? 0 : ytdTax;

  const cumGross = priorGross + grossThisPeriod;
  // Free pay for the year-to-date (negative for K codes adds to taxable).
  const freePay = ceil2((tc.allowanceAnnual * n) / WEEKS_PER_YEAR);
  const cumTaxable = Math.max(0, cumGross - freePay);

  // Band ceilings (taxable), pro-rated to date. The 45% boundary uses the
  // standard personal allowance, not the code allowance.
  const brCeil = (it.basicRateLimit * n) / WEEKS_PER_YEAR;
  const hrCeil = ((it.additionalRateThreshold - it.personalAllowance) * n) / WEEKS_PER_YEAR;

  const inBasic = Math.min(cumTaxable, brCeil);
  const inHigher = Math.min(Math.max(cumTaxable - brCeil, 0), hrCeil - brCeil);
  const inAdditional = Math.max(cumTaxable - hrCeil, 0);

  const cumTax = floor2(inBasic * it.basicRate + inHigher * it.higherRate + inAdditional * it.additionalRate);

  let taxThisPeriod = cumTax - priorTax;

  // K-code regulatory overriding limit: tax this period can't exceed 50% of pay.
  if (tc.kind === "K") {
    taxThisPeriod = Math.min(taxThisPeriod, floor2(grossThisPeriod * 0.5));
  }

  return floor2(taxThisPeriod);
}
