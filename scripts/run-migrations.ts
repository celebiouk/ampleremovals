/**
 * Run all pending database migrations.
 * Usage: npx ts-node scripts/run-migrations.ts
 *
 * Requires DATABASE_URL env var:
 *   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.pegajpwahlzlhtmltovy.supabase.co:5432/postgres
 *   or set in .env.local
 */
import { Client } from "pg";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌  DATABASE_URL is not set.");
  console.error("    Format: postgresql://postgres.{PROJECT_REF}:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:5432/postgres");
  process.exit(1);
}

const MIGRATIONS = [
  // Phase 4B
  {
    name: "notifications table",
    sql: `CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
      booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
      is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  { name: "notifications RLS", sql: "ALTER TABLE notifications ENABLE ROW LEVEL SECURITY" },
  { name: "notifications policy", sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Admins full access to notifications') THEN CREATE POLICY "Admins full access to notifications" ON notifications FOR ALL TO authenticated USING (true); END IF; END $$` },
  {
    name: "automation_templates table",
    sql: `CREATE TABLE IF NOT EXISTS automation_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('email','sms')),
      subject TEXT, body TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: "automation_rules table",
    sql: `CREATE TABLE IF NOT EXISTS automation_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL, trigger_event TEXT NOT NULL,
      trigger_conditions JSONB DEFAULT '{}',
      action_type TEXT NOT NULL CHECK (action_type IN ('email','sms','both')),
      action_template_id UUID, delay_minutes INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  { name: "automation_rules RLS", sql: "ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY" },
  { name: "automation_rules policy", sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='automation_rules' AND policyname='Admins full access to automation_rules') THEN CREATE POLICY "Admins full access to automation_rules" ON automation_rules FOR ALL TO authenticated USING (true); END IF; END $$` },
  {
    name: "automation_logs table",
    sql: `CREATE TABLE IF NOT EXISTS automation_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rule_id UUID NOT NULL REFERENCES automation_rules(id),
      booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      triggered_at TIMESTAMPTZ DEFAULT NOW(), executed_at TIMESTAMPTZ,
      status TEXT NOT NULL CHECK (status IN ('pending','sent','failed','skipped')),
      error_message TEXT
    )`,
  },
  { name: "automation_logs RLS", sql: "ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY" },
  { name: "automation_logs policy", sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='automation_logs' AND policyname='Admins full access to automation_logs') THEN CREATE POLICY "Admins full access to automation_logs" ON automation_logs FOR ALL TO authenticated USING (true); END IF; END $$` },
  {
    name: "settings table",
    sql: `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      company_name TEXT DEFAULT 'Ample Removals', company_phone TEXT DEFAULT '0333 577 2070',
      company_email TEXT DEFAULT 'bookings@ampleremovals.com', company_address TEXT DEFAULT '',
      google_review_link TEXT DEFAULT '', notify_new_booking BOOLEAN DEFAULT TRUE,
      notify_invoice_paid BOOLEAN DEFAULT TRUE, notify_invoice_overdue BOOLEAN DEFAULT TRUE,
      overdue_days INTEGER DEFAULT 7, notify_move_date_tomorrow BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  { name: "settings RLS", sql: "ALTER TABLE settings ENABLE ROW LEVEL SECURITY" },
  { name: "settings policy", sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='settings' AND policyname='Admins full access to settings') THEN CREATE POLICY "Admins full access to settings" ON settings FOR ALL TO authenticated USING (true); END IF; END $$` },
  { name: "settings default row", sql: "INSERT INTO settings (id) VALUES (1) ON CONFLICT DO NOTHING" },
  { name: "bookings lead_score", sql: "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lead_score INTEGER CHECK (lead_score BETWEEN 1 AND 5)" },
  { name: "bookings is_flagged", sql: "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE" },
  { name: "bookings flag_reason", sql: "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flag_reason TEXT" },
  // Phase 5
  { name: "invoices stripe_price_id", sql: "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_price_id TEXT" },
  { name: "invoices stripe_product_id", sql: "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_product_id TEXT" },
  { name: "invoices voided_at", sql: "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ" },
  { name: "invoices void_reason", sql: "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS void_reason TEXT" },
  {
    name: "automation rules seed",
    sql: `INSERT INTO automation_rules (name, trigger_event, action_type, delay_minutes, is_active)
      SELECT * FROM (VALUES
        ('New Booking Confirmation','booking_created','both',0,true),
        ('1 Hour Uncontacted Alert','booking_created','sms',60,true),
        ('Not Answered Follow-Up','status_changed_not_answered','email',30,true),
        ('Deposit Invoice Reminder','invoice_sent_unpaid','email',2880,true),
        ('Job Confirmed Thank You','status_changed_job_confirmed','email',0,true),
        ('Day Before Reminder','move_date_tomorrow','both',0,true),
        ('Review Request','status_changed_completed','email',1440,true),
        ('Win-Back Email','status_changed_bad_lead','email',10080,true)
      ) AS v(name,trigger_event,action_type,delay_minutes,is_active)
      WHERE NOT EXISTS (SELECT 1 FROM automation_rules LIMIT 1)`,
  },
  // Instant-quote + lead flow (Removals) — see add_instant_quote_lead_flow.sql
  {
    name: "bookings instant-quote/lead columns",
    sql: `ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS floor TEXT,
      ADD COLUMN IF NOT EXISTS has_lift BOOLEAN,
      ADD COLUMN IF NOT EXISTS parking_within_20m BOOLEAN,
      ADD COLUMN IF NOT EXISTS special_instructions TEXT,
      ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS has_white_goods BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'unpaid',
      ADD COLUMN IF NOT EXISTS deposit_claimed_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS is_partial_lead BOOLEAN DEFAULT FALSE`,
  },
  { name: "bookings deposit_status check", sql: "ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_deposit_status_check" },
  { name: "bookings deposit_status check add", sql: "ALTER TABLE bookings ADD CONSTRAINT bookings_deposit_status_check CHECK (deposit_status IN ('unpaid','claimed','verified'))" },
  {
    name: "additional_services add-on quantities",
    sql: `ALTER TABLE additional_services
      ADD COLUMN IF NOT EXISTS packing_hours INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS dismantle_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS assemble_count INT DEFAULT 0`,
  },
  { name: "bookings partial_lead index", sql: "CREATE INDEX IF NOT EXISTS idx_bookings_partial_lead ON bookings (is_partial_lead) WHERE is_partial_lead = TRUE" },
  // New-lead reminder ladder — see add_lead_reminders.sql
  {
    name: "bookings lead reminder columns",
    sql: `ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS lead_reminder_stage INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS lead_last_reminder_at TIMESTAMPTZ`,
  },
  // Quote & deposit daily follow-up drip — see add_drip_followups.sql
  {
    name: "bookings drip followup columns",
    sql: `ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS quote_followup_last_morning_sent_on DATE,
      ADD COLUMN IF NOT EXISTS quote_followup_last_evening_sent_on DATE,
      ADD COLUMN IF NOT EXISTS deposit_followup_started_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS deposit_followup_last_morning_sent_on DATE,
      ADD COLUMN IF NOT EXISTS deposit_followup_last_evening_sent_on DATE`,
  },
  {
    name: "bookings drip followup indexes",
    sql: `CREATE INDEX IF NOT EXISTS idx_bookings_quote_drip
      ON bookings (status, is_flagged, quote_followup_last_morning_sent_on, quote_followup_last_evening_sent_on)
      WHERE status = 'quote_sent'`,
  },
  {
    name: "bookings drip followup indexes 2",
    sql: `CREATE INDEX IF NOT EXISTS idx_bookings_deposit_drip
      ON bookings (status, is_flagged, deposit_followup_last_morning_sent_on, deposit_followup_last_evening_sent_on)
      WHERE status = 'deposit_invoice_sent'`,
  },
  // Smart-ETA 4-stage checkpoints (30/20/10/5-min) — see add_eta_5stage_checkpoints.sql
  {
    name: "bookings eta call4/call5 columns",
    sql: `ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS scheduled_call4_time TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS call4_eta_timestamp TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS call4_duration_seconds INT,
      ADD COLUMN IF NOT EXISTS call4_notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS scheduled_call5_time TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS call5_eta_timestamp TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS call5_duration_seconds INT,
      ADD COLUMN IF NOT EXISTS call5_notification_sent BOOLEAN NOT NULL DEFAULT FALSE`,
  },
  // Access/damage-risk incident reports — see add_job_incidents.sql
  {
    name: "job_incidents table",
    sql: `CREATE TABLE IF NOT EXISTS job_incidents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
      description TEXT NOT NULL,
      photo_paths TEXT[] NOT NULL DEFAULT '{}',
      signer_name TEXT NOT NULL,
      signature_path TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  { name: "job_incidents RLS", sql: "ALTER TABLE job_incidents ENABLE ROW LEVEL SECURITY" },
  { name: "job_incidents policy", sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='job_incidents' AND policyname='Admins full access to job_incidents') THEN CREATE POLICY "Admins full access to job_incidents" ON job_incidents FOR ALL TO authenticated USING (true); END IF; END $$` },
  { name: "job_incidents index", sql: "CREATE INDEX IF NOT EXISTS idx_job_incidents_booking ON job_incidents (booking_id, created_at DESC)" },
  // Porters as drivers-table accounts — see add_porter_accounts.sql
  {
    name: "drivers account_type",
    sql: "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'driver' CHECK (account_type IN ('driver', 'porter'))",
  },
  { name: "drivers id_card_url", sql: "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS id_card_url TEXT" },
  { name: "drop booking_porter_assignments (unused)", sql: "DROP TABLE IF EXISTS booking_porter_assignments" },
  { name: "drop porters (unused)", sql: "DROP TABLE IF EXISTS porters" },
  // Flat pay replaces %-of-invoice going forward — see add_flat_pay.sql
  {
    name: "booking_driver_assignments flat_pay_amount",
    sql: "ALTER TABLE booking_driver_assignments ADD COLUMN IF NOT EXISTS flat_pay_amount NUMERIC(10,2)",
  },
  {
    name: "driver_earnings pay_extra_amount",
    sql: "ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS pay_extra_amount NUMERIC(10,2) NOT NULL DEFAULT 0",
  },
  // AnyVan jobs — see add_anyvan_jobs.sql
  { name: "bookings is_anyvan", sql: "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_anyvan BOOLEAN NOT NULL DEFAULT FALSE" },
  { name: "booking_status anyvan_job enum value", sql: "ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'anyvan_job'" },
  {
    name: "AnyVan placeholder customer",
    sql: `INSERT INTO customers (id, full_name, email, phone)
      SELECT '00000000-0000-0000-0000-000000000001', 'AnyVan (external job)', 'anyvan@internal.ampleremovals.com', '0000000000'
      WHERE NOT EXISTS (SELECT 1 FROM customers WHERE id = '00000000-0000-0000-0000-000000000001')`,
  },
  // Manual pay requests — see add_job_pay_requests.sql
  {
    name: "job_pay_requests table",
    sql: `CREATE TABLE IF NOT EXISTS job_pay_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
      work_date DATE NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      approved_amount NUMERIC(10,2),
      approved_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
      decided_by TEXT,
      decided_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  { name: "job_pay_requests RLS", sql: "ALTER TABLE job_pay_requests ENABLE ROW LEVEL SECURITY" },
  { name: "job_pay_requests policy", sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='job_pay_requests' AND policyname='Admins full access to job_pay_requests') THEN CREATE POLICY "Admins full access to job_pay_requests" ON job_pay_requests FOR ALL TO authenticated USING (true); END IF; END $$` },
  { name: "job_pay_requests index", sql: "CREATE INDEX IF NOT EXISTS idx_job_pay_requests_driver ON job_pay_requests (driver_id, status)" },
  // Admin toggle for Premium visibility on a Removals quote — see add_show_premium_quote.sql
  { name: "bookings show_premium_quote", sql: "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS show_premium_quote BOOLEAN NOT NULL DEFAULT TRUE" },
];

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("✅ Connected to database\n");

  let passed = 0; let failed = 0;
  for (const m of MIGRATIONS) {
    try {
      await client.query(m.sql);
      console.log(`✅  ${m.name}`);
      passed++;
    } catch (e) {
      console.log(`❌  ${m.name}: ${e instanceof Error ? e.message : e}`);
      failed++;
    }
  }

  await client.end();
  console.log(`\nDone. ${passed} passed, ${failed} failed.`);
}

run().catch(e => { console.error(e); process.exit(1); });
