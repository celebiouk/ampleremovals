-- Bookkeeping & Year-End Tax module.
-- Company expenses, other (non-booking) income, director's loan ledger, and the
-- annual tax-task tracker that drives the "mark as done" reminder stop-condition.
-- All admin-only. Amounts in POUNDS, NUMERIC(10,2). vat_amount is only used once
-- the company flips settings.vat_registered on (default off).

-- Helper: admin check (matches existing tables, e.g. add_cleaner_earnings.sql)
-- admin_users(user_id) holds admin auth ids.

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

-- ── RLS: admin-only on all four new tables ───────────────────────────────────
-- Server routes use the service role (bypasses RLS); these policies are defence
-- in depth so nothing is readable/writable by anon/authenticated non-admins.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['business_expenses','other_income','director_loan_entries','tax_year_tasks']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format($p$
      CREATE POLICY "admin_all" ON %I FOR ALL
      USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
    $p$, t);
  END LOOP;
END $$;
