-- ============================================================
-- Smart Admin Alerts
-- Track which alerts have been sent to prevent duplicates
-- ============================================================

-- IMPORTANT: Run add_quote_followup.sql FIRST!
-- This migration depends on quote_confirmed_at and quote_expires_at columns

-- Add missing quote columns if not exists (in case quote followup wasn't run)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS quote_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_expires_at TIMESTAMPTZ;

-- Add alert tracking to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS quote_expiry_alert_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS address_unconfirmed_alert_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS inactivity_alert_sent BOOLEAN DEFAULT FALSE;

-- Add alert tracking to invoices table
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS overdue_alert_sent BOOLEAN DEFAULT FALSE;

-- Comments
COMMENT ON COLUMN bookings.quote_confirmed_at IS 'When customer confirmed/accepted the quote';
COMMENT ON COLUMN bookings.quote_expires_at IS 'When the quote expires (calculated from quote_valid_until)';
COMMENT ON COLUMN bookings.quote_expiry_alert_sent IS 'Alert sent when quote expires in 48hrs';
COMMENT ON COLUMN bookings.address_unconfirmed_alert_sent IS 'Alert sent when move tomorrow but address not confirmed';
COMMENT ON COLUMN bookings.inactivity_alert_sent IS 'Alert sent when customer inactive for 7 days';
COMMENT ON COLUMN invoices.overdue_alert_sent IS 'Alert sent when invoice overdue by 3+ days';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_quote_expiry_alerts
  ON bookings(quote_expires_at)
  WHERE quote_confirmed_at IS NULL
  AND quote_expiry_alert_sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_bookings_address_alerts
  ON bookings(move_date, address_confirmed)
  WHERE address_confirmed = FALSE
  AND address_unconfirmed_alert_sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_bookings_inactivity_alerts
  ON bookings(created_at, status)
  WHERE status IN ('inquiry', 'called', 'not_called', 'answered', 'processing')
  AND inactivity_alert_sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_invoices_overdue_alerts
  ON invoices(due_date, status)
  WHERE status = 'sent'
  AND overdue_alert_sent = FALSE;
