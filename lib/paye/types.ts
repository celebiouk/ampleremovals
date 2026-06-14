export type StudentLoanPlan = "none" | "plan1" | "plan2" | "plan4" | "plan5";

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  ni_number: string | null;
  tax_code: string;
  tax_basis: "cumulative" | "week1month1";
  ni_category: string;
  date_of_birth: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  start_date: string | null;
  leaving_date: string | null;
  is_director: boolean;
  pay_frequency: string;
  pay_basis: "salary" | "hourly";
  annual_salary: number;
  hourly_rate: number;
  student_loan_plan: StudentLoanPlan;
  postgrad_loan: boolean;
  bank_sort_code: string | null;
  bank_account: string | null;
  status: "active" | "left";
  created_at: string;
}

export interface PayeRun {
  id: string;
  reference: string | null;
  tax_year: string;
  period_no: number;
  period_start: string | null;
  period_end: string | null;
  pay_date: string;
  status: "draft" | "finalised" | "paid";
  created_at: string;
}

export interface PayePayslip {
  id: string;
  paye_pay_run_id: string;
  employee_id: string;
  tax_year: string;
  period_no: number;
  hours: number | null;
  gross_pay: number;
  taxable_pay: number;
  income_tax: number;
  employee_ni: number;
  employer_ni: number;
  student_loan: number;
  net_pay: number;
  tax_code_used: string | null;
  ni_category: string | null;
  status: "pending" | "paid";
  paid_at: string | null;
  // optional joined name for display
  employee_name?: string;
}
