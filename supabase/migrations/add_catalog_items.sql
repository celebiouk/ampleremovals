-- Admin-managed inventory items that extend the built-in item catalog. The
-- booking wizard shows the hardcoded base catalog PLUS the active rows here.
CREATE TABLE IF NOT EXISTS catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'More items',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
-- All access is via server-side routes (service role bypasses RLS); a public
-- read policy also lets the anon key read active items directly if ever needed.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='catalog_items' AND policyname='public read active catalog') THEN
    CREATE POLICY "public read active catalog" ON catalog_items FOR SELECT USING (active = true);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_catalog_items_active ON catalog_items (active, sort_order);
