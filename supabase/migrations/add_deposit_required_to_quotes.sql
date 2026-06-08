-- ============================================================
-- Add deposit_required field to quotes
-- Allows quotes to be sent without deposit requirement
-- ============================================================

-- Add deposit_required column (defaults to TRUE for existing quotes)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS quote_deposit_required BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN bookings.quote_deposit_required IS 'Whether customer must pay a deposit to confirm this quote';
