-- Instant-quote + lead flow (Removals).
-- New booking fields for the item template, access details, and the
-- bank-transfer deposit, plus add-on quantities. Reuses the existing
-- quote_line_items / quote_total columns and the quote_confirmed status.
-- All additive + idempotent so it is safe to re-run.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS floor TEXT,                        -- 'ground' | '1' | '2' ...
  ADD COLUMN IF NOT EXISTS has_lift BOOLEAN,                  -- null = not asked
  ADD COLUMN IF NOT EXISTS parking_within_20m BOOLEAN,        -- null = not asked
  ADD COLUMN IF NOT EXISTS special_instructions TEXT,
  ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '[]'::jsonb,   -- [{key,label,variant,quantity}]
  ADD COLUMN IF NOT EXISTS has_white_goods BOOLEAN DEFAULT FALSE, -- drives hidden +£50
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2),          -- 25% of quote_total
  ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'unpaid',  -- unpaid | claimed | verified
  ADD COLUMN IF NOT EXISTS deposit_claimed_at TIMESTAMPTZ,        -- when customer said "I've paid"
  ADD COLUMN IF NOT EXISTS is_partial_lead BOOLEAN DEFAULT FALSE; -- created via admin "New Lead"

-- Guard deposit_status to the known set (drop first so re-runs don't fail).
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_deposit_status_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_deposit_status_check
  CHECK (deposit_status IN ('unpaid', 'claimed', 'verified'));

-- Add-on quantities that feed the quote engine.
ALTER TABLE additional_services
  ADD COLUMN IF NOT EXISTS packing_hours INT DEFAULT 0,   -- £35/hr
  ADD COLUMN IF NOT EXISTS dismantle_count INT DEFAULT 0, -- £20/item
  ADD COLUMN IF NOT EXISTS assemble_count INT DEFAULT 0;  -- £20/item

-- Fast lookup of leads still awaiting self-service completion (admin list).
CREATE INDEX IF NOT EXISTS idx_bookings_partial_lead
  ON bookings (is_partial_lead) WHERE is_partial_lead = TRUE;
