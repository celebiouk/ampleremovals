-- ============================================================
-- Update company phone number to the new business number
-- Old: 07344 683477  →  New: 0333 577 2070
-- ============================================================
-- Most customer-facing emails, invoices and automations read
-- settings.company_phone from the database (the hardcoded values in
-- code are only fallbacks). This updates the live stored value.

UPDATE settings
SET company_phone = '0333 577 2070'
WHERE company_phone = '07344 683477'
   OR company_phone = '07344683477'
   OR company_phone IS NULL;

-- Update the column default too, so any future row uses the new number.
ALTER TABLE settings ALTER COLUMN company_phone SET DEFAULT '0333 577 2070';
