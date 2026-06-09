-- ============================================================
-- Move Day Countdown - Complete 7-Day Sequence
-- Add tracking for 7-day and 5-day reminders
-- (3-day and 1-day already exist from Phase 1)
-- ============================================================

-- Add countdown tracking to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS seven_day_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS five_day_reminder_sent_at TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN bookings.seven_day_reminder_sent_at IS 'When 7-day countdown reminder was sent';
COMMENT ON COLUMN bookings.five_day_reminder_sent_at IS 'When 5-day countdown reminder was sent';

-- Create indexes for countdown checks
CREATE INDEX IF NOT EXISTS idx_bookings_seven_day_countdown
  ON bookings(move_date)
  WHERE move_date IS NOT NULL
  AND status IN ('deposit_paid_job_confirmed', 'processing', 'pending')
  AND seven_day_reminder_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_five_day_countdown
  ON bookings(move_date)
  WHERE move_date IS NOT NULL
  AND status IN ('deposit_paid_job_confirmed', 'processing', 'pending')
  AND five_day_reminder_sent_at IS NULL;
