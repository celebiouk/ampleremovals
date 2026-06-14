-- Driver mobile app: smart-ETA journey state, GPS tracking, time tracking.
-- "jobs" in the spec = the existing bookings table; new fields live on bookings.
-- New tables are server-side only (service role) → RLS enabled, no policy.

-- ── 1. Journey / ETA / chain-of-custody fields on bookings ───────────────────
-- The call1/2/3 fields hold the CURRENT leg's working ETA state; current_journey_leg
-- says which leg they refer to. They reset when the delivery leg starts. The full
-- immutable per-leg history lives in journey_eta_log.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS current_journey_leg TEXT;          -- 'pickup' | 'delivery' | null
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS journey_started_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS call1_eta_timestamp TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS call1_duration_seconds INT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_call2_time TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS call2_eta_timestamp TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS call2_duration_seconds INT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS call2_notification_sent BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_call3_time TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS call3_eta_timestamp TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS call3_duration_seconds INT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS call3_notification_sent BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_confirmed BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_confirmed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_contact_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_comments TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_signature_url TEXT;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_started_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_arrived_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_confirmed BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_contact_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_comments TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_signature_url TEXT;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS live_tracking_token TEXT UNIQUE;

-- ── 2. Per-call ETA audit log (immutable history, both legs) ─────────────────
CREATE TABLE IF NOT EXISTS journey_eta_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  journey_leg TEXT NOT NULL,                    -- 'pickup' | 'delivery'
  call_number TEXT NOT NULL,                    -- '1' | '2' | '3' | 'arrived'
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  driver_lat NUMERIC(10,7),
  driver_lng NUMERIC(10,7),
  destination_lat NUMERIC(10,7),
  destination_lng NUMERIC(10,7),
  duration_seconds_returned INT,
  eta_timestamp_returned TIMESTAMPTZ,
  notification_fired BOOLEAN DEFAULT false,
  notification_type TEXT,                       -- journey_started | 20min | 10min | arrived
  scheduled_next_call_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_journey_eta_log_job ON journey_eta_log (job_id, journey_leg);

-- ── 3. Latest driver GPS (one row per driver, upserted every 60s) ────────────
CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id UUID PRIMARY KEY REFERENCES drivers(id) ON DELETE CASCADE,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  heading NUMERIC(6,2),
  speed NUMERIC(6,2),
  accuracy NUMERIC(8,2),
  recorded_at TIMESTAMPTZ,                       -- when the device captured it (offline-safe)
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Driver time tracking (clock in/out + breaks) ──────────────────────────
CREATE TABLE IF NOT EXISTS driver_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,                      -- clock_in | clock_out | break_start | break_end
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (entry_type IN ('clock_in','clock_out','break_start','break_end'))
);
CREATE INDEX IF NOT EXISTS idx_driver_time_entries_driver ON driver_time_entries (driver_id, at);

-- ── RLS: new tables are written/read server-side (service role) ──────────────
ALTER TABLE journey_eta_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_time_entries ENABLE ROW LEVEL SECURITY;
