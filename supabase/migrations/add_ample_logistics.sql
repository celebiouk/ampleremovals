-- ============================================================
-- Ample Logistics — HGV driver recruitment agency (amplelogistics.co.uk)
-- A separate business line from the removals platform, sharing only the
-- same Supabase project/admin dashboard. Two public-insert-only lead
-- tables (business driver requests, driver applications) + a private
-- storage bucket for CV uploads. See tasks/brand-playbook.md for how
-- this plugs into the shared admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS logistics_driver_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  business_email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location_postcode TEXT NOT NULL,
  business_type TEXT,
  licence_category TEXT NOT NULL,
  drivers_required INTEGER NOT NULL DEFAULT 1,
  start_date DATE,
  assignment_duration TEXT,
  shift_type TEXT,
  working_hours TEXT,
  vehicle_type TEXT,
  job_location TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'planned_future_requirement',
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'new_request',
  admin_notes TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logistics_driver_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  town_city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  licence_category TEXT NOT NULL,
  experience_years TEXT,
  driver_cpc_status TEXT,
  tacho_card_status TEXT,
  preferred_work_type TEXT,
  preferred_pattern TEXT,
  availability TEXT,
  preferred_locations TEXT,
  experience_notes TEXT,
  additional_info TEXT,
  cv_path TEXT,
  status TEXT NOT NULL DEFAULT 'new_application',
  admin_notes TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logistics_requests_status ON logistics_driver_requests(status);
CREATE INDEX IF NOT EXISTS idx_logistics_requests_created ON logistics_driver_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_logistics_applications_status ON logistics_driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_logistics_applications_created ON logistics_driver_applications(created_at);

ALTER TABLE logistics_driver_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_driver_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_driver_requests' AND policyname = 'Public can insert driver requests') THEN
    CREATE POLICY "Public can insert driver requests" ON logistics_driver_requests FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_driver_requests' AND policyname = 'Admins full access to driver requests') THEN
    CREATE POLICY "Admins full access to driver requests" ON logistics_driver_requests FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_driver_applications' AND policyname = 'Public can insert driver applications') THEN
    CREATE POLICY "Public can insert driver applications" ON logistics_driver_applications FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_driver_applications' AND policyname = 'Admins full access to driver applications') THEN
    CREATE POLICY "Admins full access to driver applications" ON logistics_driver_applications FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- Private bucket for driver CV uploads from the public application form.
INSERT INTO storage.buckets (id, name, public)
VALUES ('logistics-cvs', 'logistics-cvs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admin full access to logistics CVs" ON storage.objects;
CREATE POLICY "Admin full access to logistics CVs"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'logistics-cvs')
  WITH CHECK (bucket_id = 'logistics-cvs');

COMMENT ON TABLE logistics_driver_requests IS 'Business enquiries for temporary HGV driver cover, submitted via amplelogistics.co.uk. Managed from the same admin dashboard as the removals business, under Ample Logistics.';
COMMENT ON TABLE logistics_driver_applications IS 'HGV driver registrations/applications submitted via amplelogistics.co.uk. CVs stored in the private logistics-cvs bucket, referenced by cv_path.';
COMMENT ON COLUMN logistics_driver_requests.urgency IS 'One of: immediate, within_24_hours, within_7_days, planned_future_requirement.';
COMMENT ON COLUMN logistics_driver_applications.cv_path IS 'Path within the private logistics-cvs storage bucket, or NULL if no CV was uploaded. Resolve to a signed URL on demand — never expose the bucket publicly.';
