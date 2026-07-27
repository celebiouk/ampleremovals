-- Track how many review nudges we've sent so the daily reminder ladder can stop
-- after 7 (or once the customer leaves a rating). survey_sent_at (existing) holds
-- the last-sent time; survey_rating (existing) being non-null means "reviewed".
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS survey_reminder_count INT DEFAULT 0;
