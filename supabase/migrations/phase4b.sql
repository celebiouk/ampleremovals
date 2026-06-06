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
