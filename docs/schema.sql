-- ============================================================
-- Phase 4B Database Migrations
-- Run this in your Supabase SQL editor
-- ============================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to notifications" ON notifications;
CREATE POLICY "Admins full access to notifications"
  ON notifications FOR ALL TO authenticated USING (true);

-- Automation templates table
CREATE TABLE IF NOT EXISTS automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms')),
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to automation_templates" ON automation_templates;
CREATE POLICY "Admins full access to automation_templates"
  ON automation_templates FOR ALL TO authenticated USING (true);

-- Automation rules table
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  action_type TEXT NOT NULL CHECK (action_type IN ('email', 'sms', 'both')),
  action_template_id UUID REFERENCES automation_templates(id) ON DELETE SET NULL,
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to automation_rules" ON automation_rules;
CREATE POLICY "Admins full access to automation_rules"
  ON automation_rules FOR ALL TO authenticated USING (true);

-- Automation logs table
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending','sent','failed','skipped')),
  error_message TEXT
);
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to automation_logs" ON automation_logs;
CREATE POLICY "Admins full access to automation_logs"
  ON automation_logs FOR ALL TO authenticated USING (true);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  company_name TEXT DEFAULT 'Ample Removals',
  company_phone TEXT DEFAULT '07344 683477',
  company_email TEXT DEFAULT 'bookings@ampleremovals.com',
  company_address TEXT DEFAULT '',
  google_review_link TEXT DEFAULT '',
  notify_new_booking BOOLEAN DEFAULT TRUE,
  notify_invoice_paid BOOLEAN DEFAULT TRUE,
  notify_invoice_overdue BOOLEAN DEFAULT TRUE,
  overdue_days INTEGER DEFAULT 7,
  notify_move_date_tomorrow BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to settings" ON settings;
CREATE POLICY "Admins full access to settings"
  ON settings FOR ALL TO authenticated USING (true);
INSERT INTO settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- New columns on bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  lead_score INTEGER CHECK (lead_score BETWEEN 1 AND 5);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  flag_reason TEXT;

-- Seed built-in automation rules
INSERT INTO automation_rules (name, trigger_event, action_type, delay_minutes, is_active)
SELECT * FROM (VALUES
  ('New Booking Confirmation', 'booking_created', 'both', 0, true),
  ('1 Hour Uncontacted Alert', 'booking_created', 'sms', 60, true),
  ('Not Answered Follow-Up', 'status_changed_not_answered', 'email', 30, true),
  ('Deposit Invoice Reminder', 'invoice_sent_unpaid', 'email', 2880, true),
  ('Job Confirmed Thank You', 'status_changed_job_confirmed', 'email', 0, true),
  ('Day Before Reminder', 'move_date_tomorrow', 'both', 0, true),
  ('Review Request', 'status_changed_completed', 'email', 1440, true),
  ('Win-Back Email', 'status_changed_bad_lead', 'email', 10080, true)
) AS v(name, trigger_event, action_type, delay_minutes, is_active)
WHERE NOT EXISTS (SELECT 1 FROM automation_rules LIMIT 1);

-- Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE booking_notes;
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
-- ============================================================
-- Phase 6: Document Upload System
-- booking_documents table + storage bucket policies
-- ============================================================

-- Create booking_documents table
CREATE TABLE IF NOT EXISTS booking_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE booking_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins full access
CREATE POLICY "Admins full access to booking_documents"
  ON booking_documents FOR ALL
  TO authenticated
  USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_booking_documents_booking_id
  ON booking_documents(booking_id);

-- Comments
COMMENT ON TABLE booking_documents IS 'File attachments for bookings (photos, documents, permits)';
COMMENT ON COLUMN booking_documents.file_path IS 'Storage path in booking-documents bucket';
COMMENT ON COLUMN booking_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN booking_documents.file_type IS 'MIME type (e.g., image/jpeg, application/pdf)';

-- Storage buckets are created in Supabase Dashboard manually:
-- 1. booking-documents (private)
-- 2. company-assets (public)
-- 3. invoices (already exists, private)
-- 4. quotes (already exists, private)
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
-- ============================================================
-- Phase 7: Multi-Admin System with Role-Based Access Control
-- Super Admin: ampleremovals@gmail.com (Daniel)
-- ============================================================

-- Create admin roles enum
DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'admin',
  supabase_user_id UUID UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user_id ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);

-- Trigger for updated_at
DO $$ BEGIN
  CREATE TRIGGER trg_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Insert super admin (Daniel)
INSERT INTO admin_users (email, full_name, role, is_active)
VALUES ('ampleremovals@gmail.com', 'Daniel', 'super_admin', TRUE)
ON CONFLICT (email) DO UPDATE SET role = 'super_admin', full_name = 'Daniel';

-- Comments
COMMENT ON TABLE admin_users IS 'Admin users with role-based access control';
COMMENT ON TABLE admin_activity_log IS 'Complete audit trail of all admin actions';
COMMENT ON COLUMN admin_users.role IS 'super_admin: full access including user management, admin: standard access';
COMMENT ON COLUMN admin_users.supabase_user_id IS 'Links to Supabase Auth user';

-- Add admin_user_id to existing activity_log for backwards compatibility
ALTER TABLE activity_log
  ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activity_log_admin_user_id ON activity_log(admin_user_id);
