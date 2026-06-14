/**
 * UK PAYE rates & thresholds, versioned by tax year.
 *
 * 2026-27 figures verified against GOV.UK
 * (gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027), England &
 * Northern Ireland, NI category A.
 *
 * ⚠️ MUST be reviewed every April — HMRC changes these yearly. Add a new block
 * and point CURRENT_TAX_YEAR at it. Verify against Basic PAYE Tools before live use.
 *
 * v1 scope: England/NI tax codes (no Scottish/Welsh S/C codes), no K codes,
 * no pension, weekly pay. Each is a documented follow-up.
 */

export interface PayeRates {
  taxYear: string;
  incomeTax: {
    personalAllowance: number; // annual free pay for the standard code
    basicRate: number;
    higherRate: number;
    additionalRate: number;
    basicRateLimit: number; // taxable pay taxed at basic rate, annual
    additionalRateThreshold: number; // TOTAL income where 45% starts
  };
  ni: {
    weekly: { LEL: number; PT: number; ST: number; UEL: number };
    annual: { PT: number; ST: number; UEL: number };
    employeeMainRate: number; // PT→UEL (cat A)
    employeeUpperRate: number; // above UEL
    employerRate: number; // above ST (cat A)
  };
  studentLoan: Record<
    "plan1" | "plan2" | "plan4" | "plan5" | "postgrad",
    { annualThreshold: number; rate: number }
  >;
}

export const RATES_2026_27: PayeRates = {
  taxYear: "2026-27",
  incomeTax: {
    personalAllowance: 12570,
    basicRate: 0.2,
    higherRate: 0.4,
    additionalRate: 0.45,
    basicRateLimit: 37700, // 20% on the first £37,700 of TAXABLE pay
    additionalRateThreshold: 125140, // 45% on total income above this
  },
  ni: {
    weekly: { LEL: 129, PT: 242, ST: 96, UEL: 967 },
    annual: { PT: 12570, ST: 5000, UEL: 50270 },
    employeeMainRate: 0.08,
    employeeUpperRate: 0.02,
    employerRate: 0.15,
  },
  studentLoan: {
    plan1: { annualThreshold: 26900, rate: 0.09 },
    plan2: { annualThreshold: 29385, rate: 0.09 },
    plan4: { annualThreshold: 33795, rate: 0.09 },
    plan5: { annualThreshold: 25000, rate: 0.09 },
    postgrad: { annualThreshold: 21000, rate: 0.06 },
  },
};

export const WEEKS_PER_YEAR = 52;
export const CURRENT_TAX_YEAR = "2026-27";

export function getRates(taxYear: string = CURRENT_TAX_YEAR): PayeRates {
  if (taxYear === "2026-27") return RATES_2026_27;
  // Default to the latest known year; update when a new block is added.
  return RATES_2026_27;
}
