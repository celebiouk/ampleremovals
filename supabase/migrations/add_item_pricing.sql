-- Item-based pricing: a single config row + a price per catalogue item, both
-- editable in the admin Pricing page. The quote engine reads these to build the
-- Standard total = base + Σ(item × qty) + mileage.
CREATE TABLE IF NOT EXISTS pricing_config (
  id INT PRIMARY KEY DEFAULT 1,
  base_callout NUMERIC NOT NULL DEFAULT 120,
  free_miles NUMERIC NOT NULL DEFAULT 15,
  per_mile NUMERIC NOT NULL DEFAULT 1.5,
  premium_multiplier NUMERIC NOT NULL DEFAULT 2.25,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pricing_config_singleton CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS item_prices (
  item_key TEXT PRIMARY KEY,   -- matches INVENTORY_CATALOG keys (e.g. 'sofa')
  label TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_prices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='item_prices' AND policyname='public read item_prices') THEN
    CREATE POLICY "public read item_prices" ON item_prices FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pricing_config' AND policyname='public read pricing_config') THEN
    CREATE POLICY "public read pricing_config" ON pricing_config FOR SELECT USING (true);
  END IF;
END $$;
