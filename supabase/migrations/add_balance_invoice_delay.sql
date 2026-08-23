-- Delay the move-day full-balance invoice to ~20 min after the driver starts
-- the journey (instead of the instant it's tapped). Start Journey stamps this
-- with now()+20min; the eta-engine cron sends the balance once it's reached.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS balance_invoice_due_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_bookings_balance_due ON bookings (balance_invoice_due_at) WHERE balance_invoice_due_at IS NOT NULL;
