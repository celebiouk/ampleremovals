-- Bookkeeping & Year-End Tax module.
-- Company expenses, other (non-booking) income, director's loan ledger, and the
-- annual tax-task tracker that drives the "mark as done" reminder stop-condition.
-- All admin-only. Amounts in POUNDS, NUMERIC(10,2). vat_amount is only used once
-- the company flips settings.vat_registered on (default off).
-- Access is server-side only (service role bypasses RLS); see the RLS note below.

-- ── 1. Company expenses ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  category_other TEXT,                       -- free-text reason when category = 'Other'
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,             -- gross amount paid
  vat_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL,
  supplier TEXT,
  is_capital BOOLEAN NOT NULL DEFAULT false, -- vans/equipment: excluded from the profit estimate
  receipt_url TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (amount >= 0),
  CHECK (vat_amount >= 0)
);
CREATE INDEX IF NOT EXISTS idx_business_expenses_date ON business_expenses (expense_date);
CREATE INDEX IF NOT EXISTS idx_business_expenses_category ON business_expenses (category);

-- ── 2. Other (non-booking) income ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS other_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  category_other TEXT,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  vat_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  income_date DATE NOT NULL,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (amount >= 0),
  CHECK (vat_amount >= 0)
);
CREATE INDEX IF NOT EXISTS idx_other_income_date ON other_income (income_date);

-- ── 3. Director's loan ledger ────────────────────────────────────────────────
-- direction: 'director_to_company' (director lends in — company owes director,
-- safe credit) | 'company_to_director' (director borrows out — overdrawn, s455 risk).
CREATE TABLE IF NOT EXISTS director_loan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (amount >= 0),
  CHECK (direction IN ('director_to_company', 'company_to_director'))
);
CREATE INDEX IF NOT EXISTS idx_director_loan_date ON director_loan_entries (entry_date);

-- ── 4. Annual tax-task tracker (drives reminders + the done button) ───────────
CREATE TABLE IF NOT EXISTS tax_year_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,                    -- 'corporation_tax' | 'confirmation_statement'
  period_label TEXT NOT NULL,                 -- e.g. '2025-26' or the conf-statement year
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',     -- 'pending' | 'done'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (task_type IN ('corporation_tax', 'confirmation_statement')),
  CHECK (status IN ('pending', 'done')),
  UNIQUE (task_type, period_label)
);

-- ── 5. Company tax fields on the single-row settings table ───────────────────
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_number TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_utr TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS financial_year_end TEXT DEFAULT '03-31';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS confirmation_statement_due DATE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS incorporation_date DATE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS vat_registered BOOLEAN DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS vat_number TEXT;

-- ── RLS: deny all direct client access ───────────────────────────────────────
-- These tables are only ever read/written server-side via the service role
-- (createAdminClient), which BYPASSES RLS. Enabling RLS with no policy therefore
-- denies anon/authenticated clients while leaving the server with full access —
-- simpler and safer than a policy, and avoids depending on an admins table.
ALTER TABLE business_expenses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_income          ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_loan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_year_tasks        ENABLE ROW LEVEL SECURITY;
