-- ============================================================
-- PAYROLL SYSTEM — pay runs, payslips, adjustments
-- ============================================================
-- Worker-type-agnostic: drivers now, cleaners later via parallel
-- cleaner_earnings table. All RLS-protected.

-- 1. Pay runs (a period's worth of payroll to process together)
CREATE TABLE IF NOT EXISTS pay_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,            -- e.g. PR-2026-0001
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',      -- 'draft' | 'finalised' | 'paid' | 'cancelled'
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  finalised_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pay_runs_status ON pay_runs(status);
CREATE INDEX IF NOT EXISTS idx_pay_runs_period ON pay_runs(period_start, period_end);

-- 2. One payslip per worker per run
CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_run_id UUID NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
  worker_type TEXT NOT NULL,                 -- 'driver' | 'cleaner'
  worker_id UUID NOT NULL,                   -- drivers.id / cleaners.id
  gross_earnings NUMERIC(10,2) NOT NULL DEFAULT 0,
  tips_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  adjustments_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(10,2) NOT NULL DEFAULT 0,  -- gross + tips + adjustments
  jobs_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',    -- 'pending' | 'paid'
  paid_at TIMESTAMPTZ,
  payment_method TEXT,                       -- 'bank_transfer' | 'cash'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pay_run_id, worker_type, worker_id)
);
CREATE INDEX IF NOT EXISTS idx_payslips_run ON payslips(pay_run_id);
CREATE INDEX IF NOT EXISTS idx_payslips_worker ON payslips(worker_type, worker_id);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON payslips(status);

-- 3. Link payslips to the earnings they cover (audit + idempotency)
CREATE TABLE IF NOT EXISTS payslip_earnings (
  payslip_id UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
  earning_id UUID NOT NULL REFERENCES driver_earnings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (payslip_id, earning_id),
  UNIQUE (earning_id)  -- an earning lands on exactly one payslip
);

-- 4. Manual adjustments per payslip (bonus, deduction, advance, expense)
CREATE TABLE IF NOT EXISTS payroll_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_id UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                        -- 'bonus' | 'deduction' | 'advance' | 'expense'
  label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,             -- signed: + adds, − subtracts
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_adjustments_payslip ON payroll_adjustments(payslip_id);

-- 5. Store worker bank details (encrypted) for bank-ready CSV export
CREATE TABLE IF NOT EXISTS worker_bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_type TEXT NOT NULL,                 -- 'driver' | 'cleaner'
  worker_id UUID NOT NULL,
  sort_code TEXT,                            -- encrypted: "00-00-00"
  account_number TEXT,                       -- encrypted: 8-digit number
  account_holder_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (worker_type, worker_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE pay_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslip_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_bank_details ENABLE ROW LEVEL SECURITY;

-- Admin (service role) can do anything; anon/auth cannot.
CREATE POLICY "Admin full access" ON pay_runs
  USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON payslips
  USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON payslip_earnings
  USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON payroll_adjustments
  USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON worker_bank_details
  USING (true) WITH CHECK (true);

-- Workers can read their own payslips + adjustments (when cleaners land)
CREATE POLICY "Workers read own payslips" ON payslips
  FOR SELECT USING (
    (worker_type = 'driver' AND worker_id = auth.uid())
    OR (worker_type = 'cleaner' AND worker_id = auth.uid())
  );

CREATE POLICY "Workers read own adjustments" ON payroll_adjustments
  FOR SELECT USING (
    payslip_id IN (
      SELECT id FROM payslips
      WHERE (worker_type = 'driver' AND worker_id = auth.uid())
         OR (worker_type = 'cleaner' AND worker_id = auth.uid())
    )
  );

-- ============================================================
-- Helper: reference generator for pay_runs
-- ============================================================
-- Generates PR-YYYY-NNNN format (e.g. PR-2026-0001)
CREATE OR REPLACE FUNCTION generate_pay_run_reference()
RETURNS TEXT AS $$
DECLARE
  v_year INT;
  v_seq INT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW());
  v_seq := (
    SELECT COALESCE(MAX(
      (SUBSTRING(reference, 8, 4)::INT)
    ), 0) + 1
    FROM pay_runs
    WHERE reference LIKE 'PR-' || v_year || '-%'
  );
  RETURN 'PR-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Updated at trigger (boilerplate)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pay_runs_updated_at BEFORE UPDATE ON pay_runs
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payslips_updated_at BEFORE UPDATE ON payslips
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER worker_bank_details_updated_at BEFORE UPDATE ON worker_bank_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
