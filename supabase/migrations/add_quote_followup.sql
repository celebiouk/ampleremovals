-- ============================================================
-- Quote Follow-Up Sequence
-- Track automated follow-ups for quotes that aren't confirmed
-- ============================================================

-- Add quote follow-up tracking to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS quote_followup_2hr_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_followup_24hr_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_followup_3day_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_followup_7day_sent_at TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN bookings.quote_followup_2hr_sent_at IS 'When 2-hour quote follow-up was sent';
COMMENT ON COLUMN bookings.quote_followup_24hr_sent_at IS 'When 24-hour quote follow-up was sent';
COMMENT ON COLUMN bookings.quote_followup_3day_sent_at IS 'When 3-day quote follow-up was sent';
COMMENT ON COLUMN bookings.quote_followup_7day_sent_at IS 'When 7-day quote follow-up was sent';

-- Create index for finding quotes needing follow-up
CREATE INDEX IF NOT EXISTS idx_bookings_quote_followup
  ON bookings(quote_sent_at, quote_confirmed_at)
  WHERE quote_sent_at IS NOT NULL
  AND quote_confirmed_at IS NULL;
