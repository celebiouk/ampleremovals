-- PAYE payroll (employees on weekly PAYE — separate from the self-employed
-- subcontractor payroll in add_payroll.sql / add_drivers.sql).
-- Amounts in POUNDS, NUMERIC(10,2). Server-side access only (service role),
-- so RLS is enabled with no policy (deny-all for anon/authenticated).

-- ── Employees ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ni_number TEXT,
  tax_code TEXT NOT NULL DEFAULT '1257L',
  tax_basis TEXT NOT NULL DEFAULT 'cumulative',   -- 'cumulative' | 'week1month1'
  ni_category TEXT NOT NULL DEFAULT 'A',           -- v1: category A only
  date_of_birth DATE,
  address TEXT,
  email TEXT,
  phone TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  leaving_date DATE,
  is_director BOOLEAN NOT NULL DEFAULT false,
  pay_frequency TEXT NOT NULL DEFAULT 'weekly',
  pay_basis TEXT NOT NULL DEFAULT 'salary',        -- 'salary' | 'hourly'
  annual_salary NUMERIC(10,2) DEFAULT 0,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  student_loan_plan TEXT NOT NULL DEFAULT 'none',  -- none|plan1|plan2|plan4|plan5
  postgrad_loan BOOLEAN NOT NULL DEFAULT false,
  bank_sort_code TEXT,
  bank_account TEXT,
  status TEXT NOT NULL DEFAULT 'active',           -- 'active' | 'left'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (tax_basis IN ('cumulative','week1month1')),
  CHECK (pay_basis IN ('salary','hourly')),
  CHECK (status IN ('active','left')),
  CHECK (student_loan_plan IN ('none','plan1','plan2','plan4','plan5'))
);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees (status);

-- ── PAYE pay runs (one per tax week) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paye_pay_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT,
  tax_year TEXT NOT NULL,            -- e.g. '2026-27'
  period_no INT NOT NULL,            -- tax week 1–52
  period_start DATE,
  period_end DATE,
  pay_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'finalised' | 'paid'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (status IN ('draft','finalised','paid')),
  UNIQUE (tax_year, period_no)
);

-- ── PAYE payslips ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paye_payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paye_pay_run_id UUID NOT NULL REFERENCES paye_pay_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  tax_year TEXT NOT NULL,
  period_no INT NOT NULL,
  hours NUMERIC(6,2),
  gross_pay NUMERIC(10,2) NOT NULL DEFAULT 0,
  taxable_pay NUMERIC(10,2) NOT NULL DEFAULT 0,
  income_tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  employee_ni NUMERIC(10,2) NOT NULL DEFAULT 0,
  employer_ni NUMERIC(10,2) NOT NULL DEFAULT 0,
  student_loan NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_code_used TEXT,
  ni_category TEXT,
  -- Year-to-date snapshots (the next run reads these for cumulative tax/NI).
  ytd_gross NUMERIC(10,2) NOT NULL DEFAULT 0,
  ytd_taxable NUMERIC(10,2) NOT NULL DEFAULT 0,
  ytd_tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  ytd_ee_ni NUMERIC(10,2) NOT NULL DEFAULT 0,
  ytd_er_ni NUMERIC(10,2) NOT NULL DEFAULT 0,
  ytd_student_loan NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'paid'
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (paye_pay_run_id, employee_id)
);
CREATE INDEX IF NOT EXISTS idx_paye_payslips_employee ON paye_payslips (employee_id, tax_year, period_no);

-- ── RLS: deny direct client access (service role bypasses) ───────────────────
ALTER TABLE employees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE paye_pay_runs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE paye_payslips  ENABLE ROW LEVEL SECURITY;
