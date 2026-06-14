/**
 * UK PAYE rates & thresholds, as a per-tax-year registry (England & N. Ireland,
 * NI category A). Figures verified against GOV.UK
 * (gov.uk/guidance/rates-and-thresholds-for-employers-YYYY-to-YYYY).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ☑ ANNUAL REFRESH — do this every April when the new tax year starts:
 *   1. Open gov.uk/guidance/rates-and-thresholds-for-employers-<new>-to-<new+1>.
 *   2. Copy the latest RATES_* block below, rename it (e.g. RATES_2027_28), and
 *      update every figure (personal allowance, bands, NI weekly thresholds &
 *      rates, student-loan thresholds).
 *   3. Add it to RATES_BY_YEAR and bump LATEST_TAX_YEAR.
 * Until a year is added, the pay-run API refuses to run payroll for it (see
 * isKnownTaxYear) — so you can never silently pay staff on stale rates.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * v1 scope: England/NI tax codes (no Scottish/Welsh S/C codes), no K codes,
 * no pension, weekly pay.
 */

export interface PayeRates {
  taxYear: string;
  incomeTax: {
    personalAllowance: number;
    basicRate: number;
    higherRate: number;
    additionalRate: number;
    basicRateLimit: number; // taxable pay taxed at basic rate, annual
    additionalRateThreshold: number; // TOTAL income where 45% starts
  };
  ni: {
    weekly: { LEL: number; PT: number; ST: number; UEL: number };
    annual: { PT: number; ST: number; UEL: number };
    employeeMainRate: number;
    employeeUpperRate: number;
    employerRate: number;
  };
  studentLoan: Record<
    "plan1" | "plan2" | "plan4" | "plan5" | "postgrad",
    { annualThreshold: number; rate: number }
  >;
}

// Income-tax bands & NI rates have been frozen across these years; only the LEL
// and the student-loan thresholds differ.
const FROZEN_INCOME_TAX = {
  personalAllowance: 12570,
  basicRate: 0.2,
  higherRate: 0.4,
  additionalRate: 0.45,
  basicRateLimit: 37700,
  additionalRateThreshold: 125140,
};
const FROZEN_NI_RATES = { employeeMainRate: 0.08, employeeUpperRate: 0.02, employerRate: 0.15 };
const NI_ANNUAL = { PT: 12570, ST: 5000, UEL: 50270 };

export const RATES_2025_26: PayeRates = {
  taxYear: "2025-26",
  incomeTax: { ...FROZEN_INCOME_TAX },
  ni: { weekly: { LEL: 125, PT: 242, ST: 96, UEL: 967 }, annual: { ...NI_ANNUAL }, ...FROZEN_NI_RATES },
  studentLoan: {
    plan1: { annualThreshold: 26065, rate: 0.09 },
    plan2: { annualThreshold: 28470, rate: 0.09 },
    plan4: { annualThreshold: 32745, rate: 0.09 },
    plan5: { annualThreshold: 25000, rate: 0.09 },
    postgrad: { annualThreshold: 21000, rate: 0.06 },
  },
};

export const RATES_2026_27: PayeRates = {
  taxYear: "2026-27",
  incomeTax: { ...FROZEN_INCOME_TAX },
  ni: { weekly: { LEL: 129, PT: 242, ST: 96, UEL: 967 }, annual: { ...NI_ANNUAL }, ...FROZEN_NI_RATES },
  studentLoan: {
    plan1: { annualThreshold: 26900, rate: 0.09 },
    plan2: { annualThreshold: 29385, rate: 0.09 },
    plan4: { annualThreshold: 33795, rate: 0.09 },
    plan5: { annualThreshold: 25000, rate: 0.09 },
    postgrad: { annualThreshold: 21000, rate: 0.06 },
  },
};

export const RATES_BY_YEAR: Record<string, PayeRates> = {
  "2025-26": RATES_2025_26,
  "2026-27": RATES_2026_27,
};

export const WEEKS_PER_YEAR = 52;
export const LATEST_TAX_YEAR = "2026-27";

/** Has this tax year's rates been defined? Gate new pay runs on this. */
export function isKnownTaxYear(taxYear: string): boolean {
  return taxYear in RATES_BY_YEAR;
}

export function knownTaxYears(): string[] {
  return Object.keys(RATES_BY_YEAR).sort();
}

/**
 * The current UK tax year label for a date (the year boundary is 6 April).
 * e.g. 2026-06-14 → "2026-27"; 2027-02-01 → "2026-27".
 */
export function currentTaxYear(date: Date = new Date()): string {
  const m = date.getMonth();
  const d = date.getDate();
  const startYear = m < 3 || (m === 3 && d < 6) ? date.getFullYear() - 1 : date.getFullYear();
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

// Back-compat alias.
export const CURRENT_TAX_YEAR = LATEST_TAX_YEAR;

/**
 * Rates for a tax year. Exact match if defined; otherwise the latest known year
 * (with a warning) so historical documents still render — but NEW pay runs are
 * blocked for undefined years via isKnownTaxYear in the API.
 */
export function getRates(taxYear: string = LATEST_TAX_YEAR): PayeRates {
  const exact = RATES_BY_YEAR[taxYear];
  if (exact) return exact;
  // eslint-disable-next-line no-console
  console.warn(`[paye] No rates defined for ${taxYear}; using ${LATEST_TAX_YEAR}. Add a block to lib/paye/rates.ts.`);
  return RATES_BY_YEAR[LATEST_TAX_YEAR];
}
