-- ============================================================================
-- CONSOLIDATED — every recent schema change in one safe, idempotent script.
-- Run this ONCE in the Supabase SQL Editor. Everything uses IF NOT EXISTS /
-- ADD VALUE IF NOT EXISTS, so it's safe even if you've already run some of them.
--
-- This is schema only. The pg_cron scheduling lives in setup_pg_cron.sql (run
-- that separately — it needs your Vault secrets).
-- ============================================================================

-- ── 1. New booking_status enum values (quote flow) ──────────────────────────
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'quote_sent' BEFORE 'deposit_invoice_sent';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'quote_confirmed' BEFORE 'deposit_invoice_sent';

-- ── 2. Address coordinates (driver map + 80m arrival detection) ──────────────
ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS lat NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(10,7);

-- ── 3. Booking columns ──────────────────────────────────────────────────────
-- 3a. Marketing attribution + "how did you hear about us"
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS heard_about_us TEXT,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS gclid TEXT,
  ADD COLUMN IF NOT EXISTS fbclid TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT;

-- 3b. Lead scoring. Drop any stale CHECK constraint from an earlier lead_score
-- column (a narrower scale) so the 0–100 score can be stored.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_lead_score_check;
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS lead_score INT,
  ADD COLUMN IF NOT EXISTS lead_band TEXT;

-- 3c. Quote follow-up ladder
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS quote_followup_stage INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quote_last_followup_at TIMESTAMPTZ;

-- 3d. Driver-app journey / chain-of-custody state
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS current_journey_leg TEXT;
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

-- ── 4. Driver-app tables ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journey_eta_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  journey_leg TEXT NOT NULL,
  call_number TEXT NOT NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  driver_lat NUMERIC(10,7), driver_lng NUMERIC(10,7),
  destination_lat NUMERIC(10,7), destination_lng NUMERIC(10,7),
  duration_seconds_returned INT,
  eta_timestamp_returned TIMESTAMPTZ,
  notification_fired BOOLEAN DEFAULT false,
  notification_type TEXT,
  scheduled_next_call_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_journey_eta_log_job ON journey_eta_log (job_id, journey_leg);

CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id UUID PRIMARY KEY REFERENCES drivers(id) ON DELETE CASCADE,
  lat NUMERIC(10,7) NOT NULL, lng NUMERIC(10,7) NOT NULL,
  heading NUMERIC(6,2), speed NUMERIC(6,2), accuracy NUMERIC(8,2),
  recorded_at TIMESTAMPTZ, updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (entry_type IN ('clock_in','clock_out','break_start','break_end'))
);
CREATE INDEX IF NOT EXISTS idx_driver_time_entries_driver ON driver_time_entries (driver_id, at);

CREATE TABLE IF NOT EXISTS driver_push_tokens (
  expo_token TEXT PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_driver_push_tokens_driver ON driver_push_tokens (driver_id);

-- ── 5. Porters ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS porters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL, last_name TEXT,
  phone TEXT, email TEXT,
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

-- ── 6. Route plans ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS route_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  recommended_start TEXT,
  total_stops INT NOT NULL DEFAULT 0,
  total_miles NUMERIC(8,1) NOT NULL DEFAULT 0,
  stops JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (driver_id, plan_date)
);
CREATE INDEX IF NOT EXISTS idx_route_plans_date ON route_plans (plan_date);

ALTER TABLE booking_driver_assignments
  ADD COLUMN IF NOT EXISTS route_sequence INT;

-- ── 7. Indexes (non-partial to stay safe alongside the new enum values) ──────
CREATE INDEX IF NOT EXISTS idx_bookings_lead_score ON bookings (lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings (source);
CREATE INDEX IF NOT EXISTS idx_bookings_utm_source ON bookings (utm_source);
CREATE INDEX IF NOT EXISTS idx_bookings_quote_ladder ON bookings (status, quote_followup_stage, quote_last_followup_at);

-- ── 8. RLS on the new tables (server-side / service-role only) ───────────────
ALTER TABLE journey_eta_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_time_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_push_tokens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE porters                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_porter_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_plans                ENABLE ROW LEVEL SECURITY;
