-- ============================================================
-- Advanced Features - Phase 10
-- Smart rescheduling, seasonal campaigns, and system enhancements
-- ============================================================

-- Add rescheduling fields to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS reschedule_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS reschedule_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reschedule_new_date DATE,
  ADD COLUMN IF NOT EXISTS reschedule_reason TEXT,
  ADD COLUMN IF NOT EXISTS reschedule_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reschedule_approved_at TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN bookings.reschedule_token IS 'Secure token for customer self-service rescheduling';
COMMENT ON COLUMN bookings.reschedule_requested_at IS 'When customer requested reschedule';
COMMENT ON COLUMN bookings.reschedule_new_date IS 'Requested new move date';
COMMENT ON COLUMN bookings.reschedule_reason IS 'Customer reason for rescheduling';
COMMENT ON COLUMN bookings.reschedule_approved IS 'Whether admin approved reschedule';
COMMENT ON COLUMN bookings.reschedule_approved_at IS 'When reschedule was approved';

-- Create seasonal campaigns table
CREATE TABLE IF NOT EXISTS seasonal_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  email_subject VARCHAR(255),
  email_sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT seasonal_campaigns_discount_check CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);

-- Comments
COMMENT ON TABLE seasonal_campaigns IS 'Seasonal marketing campaigns';
COMMENT ON COLUMN seasonal_campaigns.name IS 'Campaign name (e.g., "New Year Special")';
COMMENT ON COLUMN seasonal_campaigns.discount_percentage IS 'Discount percentage offered';
COMMENT ON COLUMN seasonal_campaigns.start_date IS 'Campaign start date';
COMMENT ON COLUMN seasonal_campaigns.end_date IS 'Campaign end date';
COMMENT ON COLUMN seasonal_campaigns.is_active IS 'Whether campaign is currently active';
COMMENT ON COLUMN seasonal_campaigns.email_sent_count IS 'Number of emails sent for this campaign';

-- Create campaign recipients tracking
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES seasonal_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  UNIQUE(campaign_id, customer_id)
);

-- Comments
COMMENT ON TABLE campaign_recipients IS 'Tracks which customers received which campaigns';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_reschedule_token ON bookings(reschedule_token);
CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_dates ON seasonal_campaigns(start_date, end_date, is_active);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_customer ON campaign_recipients(customer_id);

-- Insert default seasonal campaigns
INSERT INTO seasonal_campaigns (name, description, discount_percentage, start_date, end_date, email_subject) VALUES
('New Year Special', 'New Year, New Home promotion', 15, '2027-01-01', '2027-01-31', '🎊 New Year, New Home - 15% OFF Your Move!'),
('Spring Moving Season', 'Spring house moving season', 10, '2027-03-01', '2027-05-31', '🌸 Spring Into Your New Home - 10% OFF!'),
('Summer Peak Season', 'Book early for summer moves', 5, '2027-06-01', '2027-08-31', '☀️ Beat the Summer Rush - Book Early & Save!'),
('Student Move Special', 'University term time moves', 15, '2027-09-01', '2027-09-30', '🎓 Student Move Special - 15% OFF!'),
('End of Year Rush', 'December moving specials', 10, '2027-12-01', '2027-12-31', '🎄 End of Year Moving Special - 10% OFF!')
ON CONFLICT DO NOTHING;

-- Add performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status ON bookings(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_activity_log_booking_created ON activity_log(booking_id, created_at DESC);

-- Add full-text search index for customer search
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers USING gin(to_tsvector('english', full_name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));
