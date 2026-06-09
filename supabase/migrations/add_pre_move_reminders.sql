-- ============================================================
-- Pre-Move Reminders
-- Track when pre-move reminder emails are sent
-- ============================================================

-- Add reminder tracking to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS three_day_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS one_day_reminder_sent_at TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN bookings.three_day_reminder_sent_at IS 'When 3-day pre-move reminder was sent';
COMMENT ON COLUMN bookings.one_day_reminder_sent_at IS 'When 1-day pre-move reminder was sent';

-- Create index for finding bookings needing reminders
CREATE INDEX IF NOT EXISTS idx_bookings_move_date_reminders
  ON bookings(move_date)
  WHERE move_date IS NOT NULL
  AND status IN ('deposit_paid_job_confirmed', 'processing', 'pending');
