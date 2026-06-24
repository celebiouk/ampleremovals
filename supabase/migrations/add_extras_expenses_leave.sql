-- On-site extra charges, driver expenses, and leave requests. All flow through an
-- admin-approval gate (pending → approved | rejected). Server-side only (RLS deny-all).

-- Extra charges a driver adds to a job on the day (extra boxes, long carry, waiting…).
CREATE TABLE IF NOT EXISTS job_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_job_extras_booking ON job_extras (booking_id);
CREATE INDEX IF NOT EXISTS idx_job_extras_status ON job_extras (status);

-- Driver expenses (fuel, parking, ULEZ/congestion…) with a receipt photo.
CREATE TABLE IF NOT EXISTS driver_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'other',
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  note TEXT,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_driver_expenses_driver ON driver_expenses (driver_id, status);

-- Driver leave / unavailability requests.
CREATE TABLE IF NOT EXISTS driver_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_driver_leave_driver ON driver_leave_requests (driver_id, status);

ALTER TABLE job_extras           ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_expenses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_leave_requests ENABLE ROW LEVEL SECURITY;
