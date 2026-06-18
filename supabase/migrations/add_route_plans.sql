-- Route planning (deterministic, no AI). Each night we build the next day's
-- optimal stop sequence per driver and store it for the office + driver to see.

CREATE TABLE IF NOT EXISTS route_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  recommended_start TEXT,                 -- "08:00"
  total_stops INT NOT NULL DEFAULT 0,
  total_miles NUMERIC(8,1) NOT NULL DEFAULT 0,
  stops JSONB NOT NULL DEFAULT '[]',       -- ordered [{bookingId,reference,seq,postcode,lat,lng,targetArrival,targetCompletion,travelMiles,isBreak}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (driver_id, plan_date)
);
CREATE INDEX IF NOT EXISTS idx_route_plans_date ON route_plans (plan_date);

-- Optional: record each stop's sequence on the assignment so the driver app can
-- order its list. Nullable, ignored if not set.
ALTER TABLE booking_driver_assignments
  ADD COLUMN IF NOT EXISTS route_sequence INT;

ALTER TABLE route_plans ENABLE ROW LEVEL SECURITY;
