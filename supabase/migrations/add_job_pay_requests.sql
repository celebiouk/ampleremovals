-- Manual pay requests — a driver/porter did work with no assignment already
-- in the system. On approval, a minimal AnyVan-style booking + assignment +
-- driver_earnings row is created (reusing that exact same pipeline rather
-- than loosening driver_earnings' NOT NULL booking_id/assignment_id), and
-- approved_booking_id links back to it.

CREATE TABLE IF NOT EXISTS job_pay_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_amount NUMERIC(10,2),
  approved_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE job_pay_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_pay_requests' AND policyname = 'Admins full access to job_pay_requests') THEN
    CREATE POLICY "Admins full access to job_pay_requests" ON job_pay_requests FOR ALL TO authenticated USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_pay_requests_driver ON job_pay_requests (driver_id, status);
