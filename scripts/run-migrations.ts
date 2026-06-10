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
