-- Lead scoring (deterministic, no AI). A weighted 0–100 score + band computed
-- when a booking/enquiry is created, so the team can prioritise the hottest leads.

-- Drop any stale CHECK from an earlier lead_score column so 0–100 fits.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_lead_score_check;
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS lead_score INT,                 -- 0–100
  ADD COLUMN IF NOT EXISTS lead_band TEXT;                 -- hot | warm | nurture | cold

CREATE INDEX IF NOT EXISTS idx_bookings_lead_score ON bookings (lead_score DESC);
