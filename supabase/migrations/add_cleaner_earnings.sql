-- Add cleaner_earnings table (parallel to driver_earnings)
-- Cleaners earn from house cleaning, end of tenancy, etc. jobs

CREATE TABLE IF NOT EXISTS cleaner_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  booking_total NUMERIC(10,2) NOT NULL,
  pay_percentage NUMERIC(5,2) NOT NULL DEFAULT 70.00, -- Default 70% to cleaner
  gross_earnings NUMERIC(10,2) NOT NULL, -- pay_percentage of booking_total (net of VAT)
  tip_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'paid'
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CHECK (gross_earnings >= 0),
  CHECK (tip_amount >= 0),
  CHECK (status IN ('pending', 'approved', 'paid'))
);

-- Indexes
CREATE INDEX idx_cleaner_earnings_cleaner_id ON cleaner_earnings(cleaner_id);
CREATE INDEX idx_cleaner_earnings_booking_id ON cleaner_earnings(booking_id);
CREATE INDEX idx_cleaner_earnings_status ON cleaner_earnings(status);
CREATE INDEX idx_cleaner_earnings_paid_at ON cleaner_earnings(paid_at);

-- RLS Policies
ALTER TABLE cleaner_earnings ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY "admin_all" ON cleaner_earnings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'authenticated' AND EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ))
  WITH CHECK (auth.jwt() ->> 'role' = 'authenticated' AND EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));

-- Cleaners can read their own earnings
CREATE POLICY "cleaner_read_own" ON cleaner_earnings
  FOR SELECT
  USING (
    cleaner_id = (SELECT id FROM cleaners WHERE user_id = auth.uid() LIMIT 1)
  );

-- Public (anon) can insert for webhooks
CREATE POLICY "anon_insert" ON cleaner_earnings
  FOR INSERT
  WITH CHECK (true);

-- Add notification columns to cleaners table
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN DEFAULT true;
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS notifications_sms BOOLEAN DEFAULT false;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_cleaner_earnings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleaner_earnings_update_timestamp
BEFORE UPDATE ON cleaner_earnings
FOR EACH ROW
EXECUTE FUNCTION update_cleaner_earnings_timestamp();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON cleaner_earnings TO authenticated;
GRANT SELECT ON cleaner_earnings TO anon;
