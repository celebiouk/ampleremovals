-- ============================================================
-- Move Anniversary Messages
-- Track when anniversary messages have been sent
-- ============================================================

-- Add anniversary tracking to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS anniversary_email_sent_at TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN bookings.anniversary_email_sent_at IS 'When 1-year move anniversary email was sent';

-- Create index for finding anniversaries
CREATE INDEX IF NOT EXISTS idx_bookings_anniversaries
  ON bookings(move_date)
  WHERE move_date IS NOT NULL
  AND status = 'job_completed'
  AND anniversary_email_sent_at IS NULL;
