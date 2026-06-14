-- Quote follow-up v2 — cumulative reminder cadence + explicit quote statuses.
--
-- The reminder cron now walks a 7-step ladder where each step is spaced from the
-- PREVIOUS reminder (gaps: 2h, 24h, 2d, 3d, 4d, 5d, 7d), not from the send time.
-- We track how far along the ladder each booking is and when the last reminder
-- went out, so the cron can compute the next due time without per-step columns.
--
-- Reminders run while bookings.status = 'quote_sent' and stop the instant the
-- status changes (e.g. to 'quote_confirmed' when the customer accepts, or to any
-- closed/dead status if the admin moves the lead on). bookings.status is free
-- text — no enum/constraint to alter for the two new values.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS quote_followup_stage INT NOT NULL DEFAULT 0,  -- 0 = none sent yet, 1–7 = ladder step reached
  ADD COLUMN IF NOT EXISTS quote_last_followup_at TIMESTAMPTZ;           -- when the last reminder (or the quote itself) went out

COMMENT ON COLUMN bookings.quote_followup_stage IS 'Quote reminder ladder step reached (0–7). Reset to 0 when a quote is (re)sent.';
COMMENT ON COLUMN bookings.quote_last_followup_at IS 'Timestamp the next reminder gap is measured from (the last reminder, or quote_sent_at for step 1).';

-- Fast lookup for the cron: bookings actively in the quote-sent reminder window.
CREATE INDEX IF NOT EXISTS idx_bookings_quote_followup
  ON bookings (status, quote_followup_stage, quote_last_followup_at)
  WHERE status = 'quote_sent';
