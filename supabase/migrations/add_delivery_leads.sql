-- ============================================================
-- Delivery/collection subcontracting lead-gen CRM (ampleremovals.com/logistics).
-- A one-Luton-van delivery service offered to local businesses (furniture
-- retailers, couriers, warehouses, e-commerce, etc.) — separate from
-- amplelogistics.co.uk's HGV driver recruitment agency, which this does
-- not touch. Internal CRM data only: no public insert path, service-role
-- (admin) access only. See tasks/todo.md, "Ample Logistics B2B lead-gen".
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,              -- furniture_retailer | appliance_retailer | courier | logistics_partner | warehouse_distributor | ecommerce | other
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  postcode TEXT,
  search_centre TEXT,                  -- 'thatcham' | 'newbury'
  distance_miles NUMERIC(5,2),
  source TEXT NOT NULL,                -- 'google_places' | 'companies_house' | 'manual_csv' | 'manual'
  source_place_id TEXT,                -- external id from the discovery source, for de-dup
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score INTEGER NOT NULL DEFAULT 0,
  band TEXT NOT NULL DEFAULT 'cold',   -- hot | warm | nurture | cold
  score_breakdown JSONB,
  est_jobs_per_week TEXT,
  delivery_frequency TEXT,
  required_vehicle_type TEXT,
  required_staff_count TEXT,
  distance_per_job TEXT,
  est_time_per_job TEXT,
  potential_contract_value TEXT,
  capacity_compatible BOOLEAN NOT NULL DEFAULT TRUE,
  capacity_notes TEXT,
  excluded BOOLEAN NOT NULL DEFAULT FALSE,
  excluded_reason TEXT,                -- e.g. 'removal_company' — never contacted
  status TEXT NOT NULL DEFAULT 'discovered', -- discovered | qualified | queued | contacted | followed_up | interested | pricing_requested | not_interested | unsubscribed | converted
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_lead_email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES delivery_leads(id) ON DELETE CASCADE,
  gmail_thread_id TEXT,
  gmail_message_id TEXT,
  direction TEXT NOT NULL,             -- 'outbound' | 'inbound'
  classification TEXT,                 -- interested | pricing_request | wants_call | more_info | subcontracting | future | not_interested | unsubscribe | auto_reply | unclear
  subject TEXT,
  snippet TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_lead_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES delivery_leads(id) ON DELETE CASCADE,
  sequence_step INTEGER NOT NULL DEFAULT 1, -- 1 = initial, 2 = first follow-up, 3 = final follow-up
  due_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_lead_suppression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,                -- 'unsubscribed' | 'bounced' | 'complained' | 'manual'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_leads_status ON delivery_leads(status);
CREATE INDEX IF NOT EXISTS idx_delivery_leads_category ON delivery_leads(category);
CREATE INDEX IF NOT EXISTS idx_delivery_leads_band ON delivery_leads(band);
CREATE INDEX IF NOT EXISTS idx_delivery_leads_excluded ON delivery_leads(excluded);
CREATE INDEX IF NOT EXISTS idx_delivery_lead_threads_lead ON delivery_lead_email_threads(lead_id);
CREATE INDEX IF NOT EXISTS idx_delivery_lead_followups_due ON delivery_lead_followups(due_at) WHERE sent_at IS NULL AND cancelled_at IS NULL;

ALTER TABLE delivery_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_lead_email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_lead_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_lead_suppression ENABLE ROW LEVEL SECURITY;

-- No anon policies anywhere on purpose: this is internal prospecting data,
-- not customer-submitted — every read/write goes through the service role
-- via /api/admin/* and /api/cron/* routes, same as the rest of the admin CRM.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delivery_leads' AND policyname = 'Admins full access to delivery leads') THEN
    CREATE POLICY "Admins full access to delivery leads" ON delivery_leads FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delivery_lead_email_threads' AND policyname = 'Admins full access to delivery lead threads') THEN
    CREATE POLICY "Admins full access to delivery lead threads" ON delivery_lead_email_threads FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delivery_lead_followups' AND policyname = 'Admins full access to delivery lead followups') THEN
    CREATE POLICY "Admins full access to delivery lead followups" ON delivery_lead_followups FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delivery_lead_suppression' AND policyname = 'Admins full access to delivery lead suppression') THEN
    CREATE POLICY "Admins full access to delivery lead suppression" ON delivery_lead_suppression FOR ALL TO authenticated USING (true);
  END IF;
END $$;
