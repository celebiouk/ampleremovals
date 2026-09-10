-- Quote & deposit daily follow-up drip — tracking columns.
--
-- Two independent drips run off these columns:
--   quote sequence:   anchored on the existing bookings.quote_sent_at, active while status = 'quote_sent'
--   deposit sequence: anchored on deposit_followup_started_at (new), active while status = 'deposit_invoice_sent'
--
-- Each sequence sends once per calendar day per time-of-day slot (morning: email + SMS if day<=5;
-- evening: WhatsApp) — the *_last_..._sent_on date columns are the idempotency guard so a cron re-run
-- the same day is a no-op. bookings.is_flagged / flag_reason (already added in scripts/run-migrations.ts,
-- Phase 4B, previously unused anywhere) is reused as the "14 days, no response" signal for admin review.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS quote_followup_last_morning_sent_on DATE,
  ADD COLUMN IF NOT EXISTS quote_followup_last_evening_sent_on DATE,
  ADD COLUMN IF NOT EXISTS deposit_followup_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deposit_followup_last_morning_sent_on DATE,
  ADD COLUMN IF NOT EXISTS deposit_followup_last_evening_sent_on DATE;

COMMENT ON COLUMN bookings.quote_followup_last_morning_sent_on IS 'Date the quote-drip morning slot (email + SMS if day<=5) last sent. Reset to NULL when the quote is (re)sent.';
COMMENT ON COLUMN bookings.quote_followup_last_evening_sent_on IS 'Date the quote-drip evening slot (WhatsApp) last sent. Reset to NULL when the quote is (re)sent.';
COMMENT ON COLUMN bookings.deposit_followup_started_at IS 'When the deposit invoice was first sent — anchor for the deposit follow-up drip day count.';
COMMENT ON COLUMN bookings.deposit_followup_last_morning_sent_on IS 'Date the deposit-drip morning slot (email + SMS if day<=5) last sent.';
COMMENT ON COLUMN bookings.deposit_followup_last_evening_sent_on IS 'Date the deposit-drip evening slot (WhatsApp) last sent.';

CREATE INDEX IF NOT EXISTS idx_bookings_quote_drip
  ON bookings (status, is_flagged, quote_followup_last_morning_sent_on, quote_followup_last_evening_sent_on)
  WHERE status = 'quote_sent';

CREATE INDEX IF NOT EXISTS idx_bookings_deposit_drip
  ON bookings (status, is_flagged, deposit_followup_last_morning_sent_on, deposit_followup_last_evening_sent_on)
  WHERE status = 'deposit_invoice_sent';
