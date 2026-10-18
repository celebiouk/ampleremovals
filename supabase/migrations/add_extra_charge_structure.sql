-- Structured on-the-day extra charges (item / stairs / distance / other),
-- admin-editable rates to auto-price them, and a new invoice type so an
-- approved extra gets its own payable invoice instead of just sitting there.

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS extra_item_rate NUMERIC(10,2) NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS extra_stairs_rate_per_flight NUMERIC(10,2) NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS extra_distance_free_meters INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS extra_distance_rate_per_10m NUMERIC(10,2) NOT NULL DEFAULT 5;

ALTER TABLE job_extras
  ADD COLUMN IF NOT EXISTS extra_type TEXT NOT NULL DEFAULT 'other' CHECK (extra_type IN ('item','stairs','distance','other')),
  ADD COLUMN IF NOT EXISTS item_key TEXT,
  ADD COLUMN IF NOT EXISTS quantity INTEGER,
  ADD COLUMN IF NOT EXISTS flights INTEGER,
  ADD COLUMN IF NOT EXISTS distance_meters INTEGER,
  ADD COLUMN IF NOT EXISTS auto_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
