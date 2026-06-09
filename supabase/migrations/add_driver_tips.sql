-- ============================================================
-- Driver Tips System
-- Track customer tips for drivers
-- ============================================================

-- Create driver_tips table
CREATE TABLE IF NOT EXISTS driver_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  stripe_payment_status VARCHAR(50) DEFAULT 'pending',
  driver_name VARCHAR(255),
  tip_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  CONSTRAINT driver_tips_amount_check CHECK (amount > 0)
);

-- Comments
COMMENT ON TABLE driver_tips IS 'Tracks customer tips for drivers';
COMMENT ON COLUMN driver_tips.booking_id IS 'Booking this tip is for';
COMMENT ON COLUMN driver_tips.customer_id IS 'Customer who gave the tip';
COMMENT ON COLUMN driver_tips.amount IS 'Tip amount in GBP';
COMMENT ON COLUMN driver_tips.stripe_payment_intent_id IS 'Stripe payment intent ID';
COMMENT ON COLUMN driver_tips.stripe_payment_status IS 'Payment status: pending, succeeded, failed';
COMMENT ON COLUMN driver_tips.driver_name IS 'Name of driver who received tip';
COMMENT ON COLUMN driver_tips.tip_message IS 'Optional message from customer to driver';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_driver_tips_booking ON driver_tips(booking_id);
CREATE INDEX IF NOT EXISTS idx_driver_tips_customer ON driver_tips(customer_id);
CREATE INDEX IF NOT EXISTS idx_driver_tips_status ON driver_tips(stripe_payment_status);
CREATE INDEX IF NOT EXISTS idx_driver_tips_created ON driver_tips(created_at);

-- Add tip link sent tracking to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS tip_link_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings.tip_link_sent_at IS 'When tip request was sent to customer';
