-- Worker-confirmed job completion (so pay only becomes payable once the
-- worker says the job's done AND admin confirms it) + flexible bulk payment
-- records (one payment can cover many jobs, across the earnings a driver
-- picks freely rather than a rigid date-range auto-group).

ALTER TABLE booking_driver_assignments
  ADD COLUMN IF NOT EXISTS completion_marked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_confirmed_by TEXT;

CREATE TABLE IF NOT EXISTS driver_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_payment_earnings (
  payment_id UUID NOT NULL REFERENCES driver_payments(id) ON DELETE CASCADE,
  earning_id UUID NOT NULL REFERENCES driver_earnings(id) ON DELETE CASCADE,
  PRIMARY KEY (payment_id, earning_id)
);

ALTER TABLE driver_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_payment_earnings ENABLE ROW LEVEL SECURITY;
