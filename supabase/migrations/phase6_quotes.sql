-- ============================================================
-- Phase 6: Quote System
-- Adds quote functionality to bookings table
-- ============================================================

-- Add quote fields to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS quote_line_items JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS quote_subtotal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS quote_vat_rate NUMERIC(5,2) DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS quote_vat_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS quote_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS quote_valid_until DATE,
  ADD COLUMN IF NOT EXISTS quote_notes TEXT,
  ADD COLUMN IF NOT EXISTS quote_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMPTZ;

-- Add index for quote lookups
CREATE INDEX IF NOT EXISTS idx_bookings_quote_sent_at ON bookings(quote_sent_at);

COMMENT ON COLUMN bookings.quote_line_items IS 'Array of {description, quantity, unit_price, total}';
COMMENT ON COLUMN bookings.quote_total IS 'Final quoted amount including VAT';
COMMENT ON COLUMN bookings.quote_sent_at IS 'When the quote was sent to the customer';

-- Create quotes storage bucket (run this in Supabase Dashboard Storage section or via SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('quotes', 'quotes', false) ON CONFLICT (id) DO NOTHING;

-- Note: You must create the 'quotes' bucket manually in Supabase Dashboard > Storage
-- and set up RLS policies for admin access.
