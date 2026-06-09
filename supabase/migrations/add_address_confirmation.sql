-- ============================================================
-- Address Confirmation System
-- Customers confirm their addresses on move day
-- ============================================================

-- Add address confirmation fields to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS address_confirmation_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS address_confirmation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS address_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS address_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS address_admin_reminded_at TIMESTAMPTZ;

-- Create index for finding bookings needing confirmation
CREATE INDEX IF NOT EXISTS idx_bookings_move_date_confirmation
  ON bookings(move_date, address_confirmed)
  WHERE move_date IS NOT NULL;

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_token
  ON bookings(address_confirmation_token)
  WHERE address_confirmation_token IS NOT NULL;

-- Comments
COMMENT ON COLUMN bookings.address_confirmation_token IS 'Token for customer to confirm addresses without login';
COMMENT ON COLUMN bookings.address_confirmation_sent_at IS 'When confirmation request was sent to customer';
COMMENT ON COLUMN bookings.address_confirmed_at IS 'When customer confirmed their addresses';
COMMENT ON COLUMN bookings.address_confirmed IS 'Whether customer has confirmed addresses';
COMMENT ON COLUMN bookings.address_admin_reminded_at IS 'When admin was reminded to follow up (if customer did not confirm)';
