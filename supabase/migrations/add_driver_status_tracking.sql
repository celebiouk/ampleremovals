-- ============================================================
-- Driver Status Tracking
-- Track driver status updates during move day
-- ============================================================

-- Add driver status fields to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS driver_on_way_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_20mins_away_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_10mins_away_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_15mins_to_delivery_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS job_completed_at TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN bookings.driver_on_way_at IS 'When driver clicked "On My Way" to origin';
COMMENT ON COLUMN bookings.driver_20mins_away_at IS 'When driver is 20 minutes from origin';
COMMENT ON COLUMN bookings.driver_10mins_away_at IS 'When driver is 10 minutes from origin';
COMMENT ON COLUMN bookings.driver_15mins_to_delivery_at IS 'When driver is 15 minutes from delivery address';
COMMENT ON COLUMN bookings.job_completed_at IS 'When job was marked as completed';

-- Add google review link to settings
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS google_review_link TEXT;

COMMENT ON COLUMN settings.google_review_link IS 'Google review link shown after job completion';
