-- Driver job acceptance: when assigned, a driver can accept or decline the job
-- from the assignment email (no login — token-gated link).

ALTER TABLE booking_driver_assignments
  ADD COLUMN IF NOT EXISTS acceptance_status TEXT DEFAULT 'pending',  -- pending | accepted | declined
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
