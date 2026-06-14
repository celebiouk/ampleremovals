/**
 * Student & postgraduate loan deductions, weekly.
 * Weekly threshold = annual / 52; deduction is floored to the whole pound (HMRC).
 */

import { WEEKS_PER_YEAR, type PayeRates } from "./rates";

export type StudentLoanPlan = "none" | "plan1" | "plan2" | "plan4" | "plan5";

export interface StudentLoanResult {
  plan: number;
  postgrad: number;
}

export function calculateStudentLoan(args: {
  grossThisPeriod: number;
  plan: StudentLoanPlan;
  postgrad: boolean;
  rates: PayeRates;
}): StudentLoanResult {
  const { grossThisPeriod, plan, postgrad, rates } = args;

  let planAmt = 0;
  if (plan && plan !== "none") {
    const p = rates.studentLoan[plan];
    const weeklyThreshold = p.annualThreshold / WEEKS_PER_YEAR;
    if (grossThisPeriod > weeklyThreshold) {
      planAmt = Math.floor((grossThisPeriod - weeklyThreshold) * p.rate);
    }
  }

  let pgAmt = 0;
  if (postgrad) {
    const p = rates.studentLoan.postgrad;
    const weeklyThreshold = p.annualThreshold / WEEKS_PER_YEAR;
    if (grossThisPeriod > weeklyThreshold) {
      pgAmt = Math.floor((grossThisPeriod - weeklyThreshold) * p.rate);
    }
  }

  return { plan: planAmt, postgrad: pgAmt };
}
