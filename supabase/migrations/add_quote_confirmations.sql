-- Quote confirmation tracking table
CREATE TABLE IF NOT EXISTS quote_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_quote_confirmations_booking ON quote_confirmations(booking_id);
CREATE INDEX idx_quote_confirmations_token ON quote_confirmations(token);

-- RLS: Public can insert (when confirming), admins can read
ALTER TABLE quote_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can confirm quotes"
  ON quote_confirmations
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Admins can view confirmations"
  ON quote_confirmations
  FOR SELECT
  TO authenticated
  USING (true);

-- Add activity log entry
COMMENT ON TABLE quote_confirmations IS 'Tracks when customers confirm quotes via email link';
