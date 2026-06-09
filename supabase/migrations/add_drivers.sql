-- ============================================================
-- PHASE 11: Driver Portal & Management System
-- Complete driver accounts, assignments, earnings & status tracking
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'on_leave'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE job_status_update AS ENUM (
    'on_my_way',
    'twenty_mins_away',
    'ten_mins_away',
    'fifteen_mins_to_delivery',
    'job_completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE earnings_status AS ENUM (
    'pending',
    'approved',
    'paid',
    'disputed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- DRIVERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Auth
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Personal details
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  date_of_birth DATE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,

  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  county TEXT,
  postcode TEXT,

  -- Employment
  status driver_status NOT NULL DEFAULT 'active',
  hire_date DATE DEFAULT CURRENT_DATE,
  driver_notes TEXT,

  -- Pay
  default_pay_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    -- e.g. 40.00 means driver gets 40% of booking total

  -- Documents (Supabase Storage paths)
  profile_photo_url TEXT,
  driving_licence_front_url TEXT,
  driving_licence_back_url TEXT,
  driving_licence_number TEXT,
  driving_licence_expiry DATE,

  -- Metadata
  created_by UUID,  -- UUID of the admin who created the account
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already existed
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS county TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS postcode TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS status driver_status DEFAULT 'active';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driver_notes TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS default_pay_percentage NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driving_licence_front_url TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driving_licence_back_url TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driving_licence_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driving_licence_expiry DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Comments
COMMENT ON TABLE drivers IS 'Driver accounts with employment & pay details';
COMMENT ON COLUMN drivers.auth_user_id IS 'Linked Supabase Auth user for driver login';
COMMENT ON COLUMN drivers.preferred_name IS 'What the driver likes to be called';
COMMENT ON COLUMN drivers.default_pay_percentage IS 'Default % of booking total this driver receives';
COMMENT ON COLUMN drivers.status IS 'Employment status: active | inactive | suspended | on_leave';
COMMENT ON COLUMN drivers.created_by IS 'Admin who created this driver account';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_auth_user_id ON drivers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- RLS Policies
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins full access to drivers" ON drivers;
DROP POLICY IF EXISTS "Drivers can view own record" ON drivers;
DROP POLICY IF EXISTS "Drivers can update own record" ON drivers;

-- Admins have full access
CREATE POLICY "Admins full access to drivers"
  ON drivers FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Drivers can read their own record
CREATE POLICY "Drivers can view own record"
  ON drivers FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Drivers can update their own record (limited fields enforced at API level)
CREATE POLICY "Drivers can update own record"
  ON drivers FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- ============================================================
-- BOOKING DRIVER ASSIGNMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS booking_driver_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  assigned_by UUID,   -- admin user UUID
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_lead_driver BOOLEAN DEFAULT FALSE,
    -- One booking can have multiple drivers;
    -- one of them is the lead driver
  notes TEXT,

  -- Pay override for this specific booking
  -- If null: use driver.default_pay_percentage
  pay_percentage_override NUMERIC(5,2),

  CONSTRAINT unique_booking_driver
    UNIQUE (booking_id, driver_id)
);

-- Add missing columns if table already existed
ALTER TABLE booking_driver_assignments ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE booking_driver_assignments ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE;
ALTER TABLE booking_driver_assignments ADD COLUMN IF NOT EXISTS assigned_by UUID;
ALTER TABLE booking_driver_assignments ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE booking_driver_assignments ADD COLUMN IF NOT EXISTS is_lead_driver BOOLEAN DEFAULT FALSE;
ALTER TABLE booking_driver_assignments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE booking_driver_assignments ADD COLUMN IF NOT EXISTS pay_percentage_override NUMERIC(5,2);

-- Comments
COMMENT ON TABLE booking_driver_assignments IS 'Links drivers to bookings with pay overrides';
COMMENT ON COLUMN booking_driver_assignments.is_lead_driver IS 'Is this driver the lead on this job';
COMMENT ON COLUMN booking_driver_assignments.pay_percentage_override IS 'Override pay % for this booking only';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_booking_id
  ON booking_driver_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_assignments_driver_id
  ON booking_driver_assignments(driver_id);

-- RLS Policies
ALTER TABLE booking_driver_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to assignments"
  ON booking_driver_assignments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Drivers can view own assignments"
  ON booking_driver_assignments FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- DRIVER JOB STATUS UPDATES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS driver_job_status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  status job_status_update NOT NULL,
  note TEXT,

  -- Location at time of update (optional, for future app use)
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already existed
ALTER TABLE driver_job_status_updates ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE driver_job_status_updates ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE;
ALTER TABLE driver_job_status_updates ADD COLUMN IF NOT EXISTS status job_status_update;
ALTER TABLE driver_job_status_updates ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE driver_job_status_updates ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE driver_job_status_updates ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
ALTER TABLE driver_job_status_updates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Comments
COMMENT ON TABLE driver_job_status_updates IS 'Driver status updates during jobs (on my way, arrived, etc)';
COMMENT ON COLUMN driver_job_status_updates.status IS 'on_my_way | twenty_mins_away | ten_mins_away | fifteen_mins_to_delivery | job_completed';
COMMENT ON COLUMN driver_job_status_updates.note IS 'Optional driver note with status update';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_status_booking_id
  ON driver_job_status_updates(booking_id);
CREATE INDEX IF NOT EXISTS idx_job_status_driver_id
  ON driver_job_status_updates(driver_id);
CREATE INDEX IF NOT EXISTS idx_job_status_created_at
  ON driver_job_status_updates(created_at DESC);

-- RLS Policies
ALTER TABLE driver_job_status_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to job status updates"
  ON driver_job_status_updates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Drivers can insert and view own updates"
  ON driver_job_status_updates FOR ALL
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- DRIVER EARNINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL
    REFERENCES booking_driver_assignments(id) ON DELETE CASCADE,

  -- Calculation
  booking_total NUMERIC(10,2) NOT NULL,
    -- Total invoice amount paid for the booking
  pay_percentage NUMERIC(5,2) NOT NULL,
    -- The % used for THIS earning (from assignment or driver default)
  gross_earnings NUMERIC(10,2) NOT NULL,
    -- booking_total × (pay_percentage / 100)
  tip_amount NUMERIC(10,2) DEFAULT 0.00,
  total_earnings NUMERIC(10,2) NOT NULL,
    -- gross_earnings + tip_amount

  status earnings_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_driver_booking_earning
    UNIQUE (driver_id, booking_id)
);

-- Add missing columns if table already existed
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE;
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES booking_driver_assignments(id) ON DELETE CASCADE;
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS booking_total NUMERIC(10,2);
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS pay_percentage NUMERIC(5,2);
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS gross_earnings NUMERIC(10,2);
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(10,2);
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS status earnings_status DEFAULT 'pending';
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Comments
COMMENT ON TABLE driver_earnings IS 'Calculated earnings per driver per booking';
COMMENT ON COLUMN driver_earnings.booking_total IS 'Total invoice paid amount';
COMMENT ON COLUMN driver_earnings.pay_percentage IS 'Percentage used for this calculation';
COMMENT ON COLUMN driver_earnings.gross_earnings IS 'Base earnings before tips';
COMMENT ON COLUMN driver_earnings.tip_amount IS 'Sum of all tips for this driver on this booking';
COMMENT ON COLUMN driver_earnings.total_earnings IS 'Gross + tips';
COMMENT ON COLUMN driver_earnings.status IS 'pending | approved | paid | disputed';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_earnings_driver_id ON driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_earnings_booking_id ON driver_earnings(booking_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON driver_earnings(status);

-- RLS Policies
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to driver_earnings"
  ON driver_earnings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Drivers can view own earnings"
  ON driver_earnings FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- DRIVER TIPS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS driver_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  recorded_by TEXT NOT NULL DEFAULT 'admin',
    -- 'admin' | 'stripe' (future: from customer tip system)
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already existed
ALTER TABLE driver_tips ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE;
ALTER TABLE driver_tips ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE driver_tips ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);
ALTER TABLE driver_tips ADD COLUMN IF NOT EXISTS recorded_by TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE driver_tips ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE driver_tips ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Comments
COMMENT ON TABLE driver_tips IS 'Tips given to drivers (admin-entered or customer-given)';
COMMENT ON COLUMN driver_tips.recorded_by IS 'Who recorded this tip: admin | stripe';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tips_driver_id ON driver_tips(driver_id);
CREATE INDEX IF NOT EXISTS idx_tips_booking_id ON driver_tips(booking_id);

-- RLS Policies
ALTER TABLE driver_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to driver_tips"
  ON driver_tips FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Drivers can view own tips"
  ON driver_tips FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- UPDATE EXISTING TABLES
-- ============================================================

-- Add latest driver status to bookings for quick reference
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS latest_driver_status job_status_update;

COMMENT ON COLUMN bookings.latest_driver_status IS 'Most recent driver status update for this booking';

-- ============================================================
-- ENABLE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime
  ADD TABLE driver_job_status_updates;

ALTER PUBLICATION supabase_realtime
  ADD TABLE booking_driver_assignments;

ALTER PUBLICATION supabase_realtime
  ADD TABLE driver_earnings;
