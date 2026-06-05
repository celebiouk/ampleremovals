-- ============================================================
-- Ample Removals — Full database schema (PostgreSQL / Supabase)
-- Run this in the Supabase SQL editor.
-- Idempotent-ish: uses IF NOT EXISTS where supported.
-- ============================================================

-- ─────────────── ENUMS ───────────────
DO $$ BEGIN
  CREATE TYPE service_type AS ENUM (
    'removals', 'man_and_van', 'house_clearance',
    'house_cleaning', 'end_of_tenancy'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE removal_type AS ENUM ('domestic', 'business');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('flat', 'house', 'bungalow');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE bedroom_count AS ENUM ('studio', '1', '2', '3', '4', '5+');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE van_type AS ENUM ('small', 'medium', 'large');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cleaning_type AS ENUM ('regular', 'deep', 'one_off');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cleaning_frequency AS ENUM ('one_off', 'weekly', 'fortnightly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clearance_type AS ENUM ('full', 'partial', 'single_room');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'inquiry', 'called', 'not_called', 'answered', 'not_answered',
    'processing', 'pending', 'deposit_invoice_sent',
    'deposit_paid_job_confirmed', 'full_invoice_sent', 'full_balance_paid',
    'job_completed', 'bad_lead', 'not_a_good_fit'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_type AS ENUM ('deposit', 'full_balance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────── TABLES ───────────────
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT customers_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_1 TEXT NOT NULL,
  line_2 TEXT,
  city TEXT,
  county TEXT,
  postcode TEXT NOT NULL,
  country TEXT DEFAULT 'United Kingdom',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  service_type service_type NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  origin_address_id UUID REFERENCES addresses(id),
  destination_address_id UUID REFERENCES addresses(id),
  status booking_status NOT NULL DEFAULT 'inquiry',
  move_date DATE,
  is_flexible_date BOOLEAN DEFAULT FALSE,
  flexible_date_from DATE,
  flexible_date_to DATE,
  description TEXT,
  internal_notes TEXT,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS removals_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  removal_type removal_type NOT NULL,
  property_type property_type NOT NULL,
  bedrooms bedroom_count NOT NULL
);

CREATE TABLE IF NOT EXISTS man_and_van_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  van_type van_type NOT NULL
);

CREATE TABLE IF NOT EXISTS house_clearance_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  clearance_type clearance_type NOT NULL,
  property_type property_type NOT NULL,
  bedrooms bedroom_count NOT NULL,
  items_of_note TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS house_cleaning_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  cleaning_type cleaning_type NOT NULL,
  frequency cleaning_frequency NOT NULL,
  property_type property_type NOT NULL,
  bedrooms bedroom_count NOT NULL,
  preferred_time_slot TEXT,
  access_instructions TEXT
);

CREATE TABLE IF NOT EXISTS end_of_tenancy_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  property_type property_type NOT NULL,
  bedrooms bedroom_count NOT NULL,
  tenancy_end_date DATE,
  access_instructions TEXT,
  addons TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS additional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  packing_services BOOLEAN DEFAULT FALSE,
  packing_materials BOOLEAN DEFAULT FALSE,
  disassemble_furniture BOOLEAN DEFAULT FALSE,
  assemble_furniture BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS booking_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  previous_status booking_status,
  new_status booking_status NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system',
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  performed_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  type invoice_type NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) DEFAULT 0,
  vat_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  stripe_payment_link TEXT,
  stripe_payment_intent_id TEXT,
  pdf_url TEXT,
  notes TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  amount NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  payment_method TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS server_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────── INDEXES ───────────────
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(reference);
CREATE INDEX IF NOT EXISTS idx_activity_log_booking_id ON activity_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_status_history_booking_id ON status_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────── ROW LEVEL SECURITY ───────────────
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE removals_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE man_and_van_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_clearance_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_cleaning_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE end_of_tenancy_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_logs ENABLE ROW LEVEL SECURITY;

-- Public (anon) INSERT for website form submissions.
-- NOTE: API routes use the service-role key (bypasses RLS); these policies
-- exist so the public flow also works with the anon key if ever needed.
DROP POLICY IF EXISTS "Public can insert customers" ON customers;
CREATE POLICY "Public can insert customers"
  ON customers FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert addresses" ON addresses;
CREATE POLICY "Public can insert addresses"
  ON addresses FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert bookings" ON bookings;
CREATE POLICY "Public can insert bookings"
  ON bookings FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert removals_details" ON removals_details;
CREATE POLICY "Public can insert removals_details"
  ON removals_details FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert man_and_van_details" ON man_and_van_details;
CREATE POLICY "Public can insert man_and_van_details"
  ON man_and_van_details FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert house_clearance_details" ON house_clearance_details;
CREATE POLICY "Public can insert house_clearance_details"
  ON house_clearance_details FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert house_cleaning_details" ON house_cleaning_details;
CREATE POLICY "Public can insert house_cleaning_details"
  ON house_cleaning_details FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert end_of_tenancy_details" ON end_of_tenancy_details;
CREATE POLICY "Public can insert end_of_tenancy_details"
  ON end_of_tenancy_details FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert additional_services" ON additional_services;
CREATE POLICY "Public can insert additional_services"
  ON additional_services FOR INSERT TO anon WITH CHECK (true);

-- Authenticated admins have full access to every table.
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'customers','addresses','bookings','removals_details','man_and_van_details',
    'house_clearance_details','house_cleaning_details','end_of_tenancy_details',
    'additional_services','booking_notes','status_history','activity_log',
    'invoices','payments','server_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins have full access" ON %I;', t);
    EXECUTE format(
      'CREATE POLICY "Admins have full access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
      t
    );
  END LOOP;
END $$;
