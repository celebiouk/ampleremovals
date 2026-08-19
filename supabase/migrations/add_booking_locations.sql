-- Multiple pickup / drop-off locations per booking, each with its own property
-- details (Phase D+E). Up to 2 pickups and 2 drop-offs. Replaces the single
-- origin_address_id / destination_address_id model for richer moves, while those
-- columns stay as the "primary" pickup/drop-off for back-compat.
CREATE TABLE IF NOT EXISTS booking_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  role text NOT NULL,                    -- 'pickup' | 'dropoff'
  sequence int NOT NULL DEFAULT 1,       -- 1 = primary, 2 = second stop
  -- Address
  line_1 text,
  line_2 text,
  city text,
  county text,
  postcode text,
  country text DEFAULT 'United Kingdom',
  lat numeric,
  lng numeric,
  -- Property details (Phase E)
  property_type text,                    -- 'house' | 'flat' | 'bungalow' | 'maisonette' | 'other'
  floor text,                            -- 'ground' | '1' | '2' | ... (for flats)
  has_stairs boolean,                    -- steps/stairs to the door
  num_steps int,                         -- how many steps (if has_stairs)
  has_lift boolean,
  has_parking boolean,
  narrow_access boolean,                 -- narrow door / hallway / tight access
  access_notes text,                     -- anything else about the address
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_locations_booking ON booking_locations (booking_id, role, sequence);

ALTER TABLE booking_locations ENABLE ROW LEVEL SECURITY;
-- Logged-in admins may read; writes go through the service role (bypasses RLS).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='booking_locations' AND policyname='authenticated read booking_locations') THEN
    CREATE POLICY "authenticated read booking_locations" ON booking_locations FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
