-- ============================================================
-- Referral Program
-- Track customer referrals - both referrer and referee get rewards
-- ============================================================

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  referee_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  referral_code VARCHAR(20) NOT NULL UNIQUE,
  referee_name VARCHAR(255),
  referee_email VARCHAR(255),
  referee_phone VARCHAR(50),
  referee_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  referrer_reward_amount DECIMAL(10, 2) DEFAULT 20.00,
  referee_reward_amount DECIMAL(10, 2) DEFAULT 20.00,
  referrer_reward_claimed BOOLEAN DEFAULT FALSE,
  referee_reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT referrals_status_check CHECK (status IN ('pending', 'completed', 'expired', 'cancelled'))
);

-- Add referral code to customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS referral_email_sent_at TIMESTAMPTZ;

-- Comments
COMMENT ON TABLE referrals IS 'Tracks customer referrals and rewards';
COMMENT ON COLUMN referrals.referrer_customer_id IS 'Customer who referred';
COMMENT ON COLUMN referrals.referee_customer_id IS 'Customer who was referred';
COMMENT ON COLUMN referrals.referral_code IS 'Unique code used for this referral';
COMMENT ON COLUMN referrals.status IS 'pending, completed, expired, cancelled';
COMMENT ON COLUMN referrals.referrer_reward_amount IS 'Reward amount for referrer (default £20)';
COMMENT ON COLUMN referrals.referee_reward_amount IS 'Reward amount for referee (default £20)';

COMMENT ON COLUMN customers.referral_code IS 'Unique referral code for this customer';
COMMENT ON COLUMN customers.referred_by_code IS 'Referral code they used when booking';
COMMENT ON COLUMN customers.referral_email_sent_at IS 'When referral program email was sent';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_customer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_customer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON customers(referral_code);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(customer_name TEXT)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  counter INT := 0;
BEGIN
  -- Generate code from first 3 letters of name + random 4-digit number
  LOOP
    code := UPPER(SUBSTRING(REGEXP_REPLACE(customer_name, '[^a-zA-Z]', '', 'g'), 1, 3)) ||
            LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM customers WHERE referral_code = code) THEN
      RETURN code;
    END IF;

    counter := counter + 1;
    IF counter > 100 THEN
      -- Fallback to fully random if can't find unique code
      code := 'REF' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate referral codes for existing customers
UPDATE customers
SET referral_code = generate_referral_code(full_name)
WHERE referral_code IS NULL;
