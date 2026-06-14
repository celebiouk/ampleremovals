/**
 * Orchestrates one employee's weekly gross-to-net for a tax week.
 * Pure (no DB) so it can be unit-checked against HMRC's calculator.
 *
 * v1: no pre-tax deductions, so taxable pay = NI-able pay = gross.
 */

import { getRates } from "./rates";
import { calculateIncomeTax } from "./income-tax";
import { calculateNI } from "./national-insurance";
import { calculateStudentLoan, type StudentLoanPlan } from "./student-loan";

export interface PayslipYTD {
  gross: number;
  taxable: number;
  tax: number;
  employeeNi: number;
  employerNi: number;
  studentLoan: number;
}

export interface CalcInput {
  grossThisPeriod: number;
  taxCode: string;
  taxBasisWeek1?: boolean; // employee on week1/month1 (non-cumulative) basis
  isDirector: boolean;
  studentLoanPlan: StudentLoanPlan;
  postgradLoan: boolean;
  periodNo: number; // tax week 1–52
  taxYear?: string;
  ytd: PayslipYTD; // totals BEFORE this period
}

export interface CalcResult {
  grossPay: number;
  taxablePay: number;
  incomeTax: number;
  employeeNi: number;
  employerNi: number;
  studentLoan: number;
  netPay: number;
  ytd: PayslipYTD; // totals INCLUDING this period
}

export function calculatePayslip(input: CalcInput): CalcResult {
  const rates = getRates(input.taxYear);
  const gross = round2(input.grossThisPeriod);

  const incomeTax = calculateIncomeTax({
    grossThisPeriod: gross,
    ytdGross: input.ytd.taxable,
    ytdTax: input.ytd.tax,
    taxCode: input.taxCode,
    periodNo: input.periodNo,
    rates,
    forceWeekOne: input.taxBasisWeek1,
  });

  const ni = calculateNI({
    grossThisPeriod: gross,
    ytdGross: input.ytd.gross,
    ytdEmployeeNi: input.ytd.employeeNi,
    ytdEmployerNi: input.ytd.employerNi,
    isDirector: input.isDirector,
    rates,
  });

  const sl = calculateStudentLoan({
    grossThisPeriod: gross,
    plan: input.studentLoanPlan,
    postgrad: input.postgradLoan,
    rates,
  });
  const studentLoan = sl.plan + sl.postgrad;

  const netPay = round2(gross - incomeTax - ni.employee - studentLoan);

  return {
    grossPay: gross,
    taxablePay: gross, // no pre-tax deductions in v1
    incomeTax,
    employeeNi: ni.employee,
    employerNi: ni.employer,
    studentLoan,
    netPay,
    ytd: {
      gross: round2(input.ytd.gross + gross),
      taxable: round2(input.ytd.taxable + gross),
      tax: round2(input.ytd.tax + incomeTax),
      employeeNi: round2(input.ytd.employeeNi + ni.employee),
      employerNi: round2(input.ytd.employerNi + ni.employer),
      studentLoan: round2(input.ytd.studentLoan + studentLoan),
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
