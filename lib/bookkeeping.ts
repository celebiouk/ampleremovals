/**
 * Bookkeeping shared constants, types and the corporation-tax estimate.
 * Mirrored (categories only) in admin-app/lib/bookkeeping.ts for mobile.
 */

export const EXPENSE_CATEGORIES = [
  "Fuel",
  "Vehicle maintenance",
  "Vehicle insurance",
  "Vehicle hire/lease",
  "Road tax & MOT",
  "Equipment & tools",
  "Packing materials",
  "Subcontractor labour",
  "Rent & premises",
  "Utilities",
  "Phone & internet",
  "Software & subscriptions",
  "Business insurance",
  "Marketing",
  "Professional fees",
  "Bank charges",
  "Office supplies",
  "Training",
  "Travel & parking",
  "Congestion/clean-air/ULEZ",
  "Waste disposal",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Vehicle/asset sale",
  "Interest received",
  "Rental/sublet income",
  "Insurance payout",
  "Grant",
  "Scrap/recycling",
  "Referral commission",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export interface BusinessExpense {
  id: string;
  category: string;
  category_other: string | null;
  description: string | null;
  amount: number;
  vat_amount: number;
  expense_date: string;
  supplier: string | null;
  is_capital: boolean;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface OtherIncome {
  id: string;
  category: string;
  category_other: string | null;
  description: string | null;
  amount: number;
  vat_amount: number;
  income_date: string;
  notes: string | null;
  created_at: string;
}

export interface DirectorLoanEntry {
  id: string;
  direction: "director_to_company" | "company_to_director";
  amount: number;
  entry_date: string;
  description: string | null;
  notes: string | null;
  created_at: string;
}

export interface TaxYearTask {
  id: string;
  task_type: "corporation_tax" | "confirmation_statement";
  period_label: string;
  due_date: string | null;
  status: "pending" | "done";
  completed_at: string | null;
}

/**
 * UK corporation-tax estimate (FY2023 onward), assuming one associated company
 * and a full 12-month accounting period.
 *   profit ≤ £50,000  → 19%
 *   profit ≥ £250,000 → 25%
 *   in between        → 25% main rate less marginal relief (fraction 3/200)
 */
export function estimateCorporationTax(profit: number): number {
  if (profit <= 0) return 0;
  const LOWER = 50000;
  const UPPER = 250000;
  if (profit <= LOWER) return round2(profit * 0.19);
  if (profit >= UPPER) return round2(profit * 0.25);
  const marginalRelief = (UPPER - profit) * (3 / 200);
  return round2(profit * 0.25 - marginalRelief);
}

/**
 * The accounting period [start, end] (inclusive, YYYY-MM-DD) for a given
 * year-end (MM-DD, default 31 March) and the END calendar year.
 * e.g. yearEnd '03-31', endYear 2026 → { start: '2025-04-01', end: '2026-03-31' }.
 */
export function financialYearRange(
  yearEndMMDD: string,
  endYear: number
): { start: string; end: string; label: string } {
  const [mm, dd] = (yearEndMMDD || "03-31").split("-").map((n) => parseInt(n, 10));
  const end = `${endYear}-${pad(mm)}-${pad(dd)}`;
  // Start = day after the previous year-end.
  const endDate = new Date(Date.UTC(endYear, mm - 1, dd));
  const startDate = new Date(endDate);
  startDate.setUTCFullYear(startDate.getUTCFullYear() - 1);
  startDate.setUTCDate(startDate.getUTCDate() + 1);
  const start = startDate.toISOString().slice(0, 10);
  const label = `${startDate.getUTCFullYear()}-${String(endYear).slice(2)}`;
  return { start, end, label };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
