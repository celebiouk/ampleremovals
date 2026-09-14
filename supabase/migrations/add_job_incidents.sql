-- Access/damage-risk incident reports: a driver hits a specific risk mid-job
-- (an item/doorway/property situation that could cause damage), tells the
-- customer, and if the customer agrees to proceed anyway, the driver captures
-- their own written account + photos + the customer's signature for that
-- SPECIFIC decision. A job can have multiple incidents, unlike the existing
-- one-per-job generic liability waiver (bookings.waiver_signed).

CREATE TABLE IF NOT EXISTS job_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  photo_paths TEXT[] NOT NULL DEFAULT '{}',
  signer_name TEXT NOT NULL,
  signature_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE job_incidents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_incidents' AND policyname = 'Admins full access to job_incidents') THEN
    CREATE POLICY "Admins full access to job_incidents" ON job_incidents FOR ALL TO authenticated USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_incidents_booking ON job_incidents (booking_id, created_at DESC);
