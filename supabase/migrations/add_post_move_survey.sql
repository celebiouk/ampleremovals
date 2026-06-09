-- ============================================================
-- Post-Move Survey
-- Collect feedback 2 hours after job completion
-- ============================================================

-- Add survey tracking to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS survey_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS survey_rating INTEGER CHECK (survey_rating >= 1 AND survey_rating <= 5),
  ADD COLUMN IF NOT EXISTS survey_feedback TEXT,
  ADD COLUMN IF NOT EXISTS survey_completed_at TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN bookings.survey_sent_at IS 'When post-move survey email was sent';
COMMENT ON COLUMN bookings.survey_rating IS 'Customer rating (1-5 stars)';
COMMENT ON COLUMN bookings.survey_feedback IS 'Customer feedback text';
COMMENT ON COLUMN bookings.survey_completed_at IS 'When customer completed survey';

-- Create index for finding jobs needing survey
CREATE INDEX IF NOT EXISTS idx_bookings_survey_pending
  ON bookings(job_completed_at, survey_sent_at)
  WHERE job_completed_at IS NOT NULL
  AND survey_sent_at IS NULL;
