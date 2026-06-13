-- Payslip/pay-run archiving.
-- Adds a nullable archived_at timestamp to pay_runs so finalised/old runs can be
-- hidden from the default list without losing their paid/finalised status.
-- Archiving is orthogonal to status (you can archive a paid run), hence a
-- dedicated column rather than overloading `status`.

ALTER TABLE pay_runs ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Fast filtering of active vs archived runs.
CREATE INDEX IF NOT EXISTS idx_pay_runs_archived_at ON pay_runs (archived_at);
