-- Lead source / marketing attribution on bookings.
--
-- bookings.source already exists (was hardcoded "website"); it now holds a
-- derived channel (facebook, google_ads, google_organic, referral, direct…).
-- heard_about_us is the customer's self-reported answer; the utm_/click-id/
-- referrer columns are auto-captured from the landing URL for real attribution.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS heard_about_us TEXT,   -- self-reported ("How did you hear about us?")
  ADD COLUMN IF NOT EXISTS utm_source     TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium     TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign   TEXT,
  ADD COLUMN IF NOT EXISTS utm_term       TEXT,
  ADD COLUMN IF NOT EXISTS utm_content    TEXT,
  ADD COLUMN IF NOT EXISTS gclid          TEXT,   -- Google Ads click id
  ADD COLUMN IF NOT EXISTS fbclid         TEXT,   -- Meta/Facebook click id
  ADD COLUMN IF NOT EXISTS referrer       TEXT,   -- document.referrer at first touch
  ADD COLUMN IF NOT EXISTS landing_page   TEXT;   -- first page the visitor landed on

CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings (source);
CREATE INDEX IF NOT EXISTS idx_bookings_utm_source ON bookings (utm_source);
