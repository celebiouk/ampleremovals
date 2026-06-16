-- Porters — second crew members who assist drivers on larger jobs.
-- Mirrors the drivers model but lighter (no app login). Service-role only.

CREATE TABLE IF NOT EXISTS porters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  default_day_rate NUMERIC(10,2) DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_porters_status ON porters (status);

CREATE TABLE IF NOT EXISTS booking_porter_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  porter_id UUID NOT NULL REFERENCES porters(id) ON DELETE CASCADE,
  day_rate NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (booking_id, porter_id)
);
CREATE INDEX IF NOT EXISTS idx_bpa_booking ON booking_porter_assignments (booking_id);
CREATE INDEX IF NOT EXISTS idx_bpa_porter ON booking_porter_assignments (porter_id);

ALTER TABLE porters ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_porter_assignments ENABLE ROW LEVEL SECURITY;
