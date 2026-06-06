-- ============================================================
-- Phase 5 Database Migrations
-- Run this in your Supabase SQL editor
-- ============================================================

-- Add missing columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS void_reason TEXT;

-- Create Supabase Storage bucket for invoice PDFs
-- Run this in the Supabase Dashboard > Storage > New Bucket
-- Name: invoices, Private: true
-- OR use the SQL below (if storage schema is accessible):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false) ON CONFLICT DO NOTHING;

-- RLS for invoices table (confirm exists)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon can read invoices by id" ON invoices;
CREATE POLICY "Anon can read invoices by id"
  ON invoices FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Authenticated full access to invoices" ON invoices;
CREATE POLICY "Authenticated full access to invoices"
  ON invoices FOR ALL TO authenticated USING (true);

-- RLS for payments table (confirm exists)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated full access to payments" ON payments;
CREATE POLICY "Authenticated full access to payments"
  ON payments FOR ALL TO authenticated USING (true);

-- NOTE: After running this SQL, create the 'invoices' storage bucket
-- in Supabase Dashboard > Storage > New Bucket:
--   Name: invoices
--   Public: false (private)
