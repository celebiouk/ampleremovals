/**
 * Bookkeeping categories + types for the mobile admin app.
 * Mirror of the web lib/bookkeeping.ts (the corporation-tax estimate lives only
 * on the server; mobile just renders what the API returns).
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
