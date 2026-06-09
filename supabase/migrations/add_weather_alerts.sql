-- ============================================================
-- Weather Alerts
-- Track when bad weather alerts have been sent
-- ============================================================

-- Add weather alert tracking to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS weather_alert_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS weather_alert_type VARCHAR(50);

-- Comments
COMMENT ON COLUMN bookings.weather_alert_sent_at IS 'When bad weather alert was sent';
COMMENT ON COLUMN bookings.weather_alert_type IS 'Type of weather alert sent (rain, snow, wind, etc)';

-- Create index
CREATE INDEX IF NOT EXISTS idx_bookings_weather_alerts
  ON bookings(move_date)
  WHERE move_date IS NOT NULL
  AND weather_alert_sent_at IS NULL
  AND status IN ('deposit_paid_job_confirmed', 'processing', 'pending');
