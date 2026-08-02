-- Office postcode — the point distances are measured FROM (office → first pickup).
-- Editable in Admin > Settings > Company. Defaults to the current office (RG18 3EB)
-- but is never hardcoded in the app: the distance endpoint reads whatever's here.
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS office_postcode TEXT DEFAULT 'RG18 3EB';

-- Backfill the existing singleton row so distances work immediately.
UPDATE settings SET office_postcode = 'RG18 3EB' WHERE id = 1 AND (office_postcode IS NULL OR office_postcode = '');

-- Let PostgREST see the new column right away.
NOTIFY pgrst, 'reload schema';
