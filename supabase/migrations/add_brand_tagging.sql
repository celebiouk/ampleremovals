-- Multi-brand tagging — see lib/brands.ts for the brand registry. Every
-- booking is tagged with which storefront it came through, defaulting to
-- 'ample' so every existing row (and every row inserted by code that hasn't
-- been updated to pass a brand yet) keeps working exactly as before.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT 'ample';
CREATE INDEX IF NOT EXISTS idx_bookings_brand ON bookings(brand);
COMMENT ON COLUMN bookings.brand IS 'Which white-label storefront this booking came through — see lib/brands.ts. Drives email sender identity, SMS gating, and admin brand filtering.';

-- Same for the WhatsApp queue, so admin can tell at a glance which brand a
-- queued message belongs to and never send a ManyVans lead's message from
-- the Ample WhatsApp number by mistake.
ALTER TABLE whatsapp_queue ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT 'ample';
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_brand ON whatsapp_queue(brand);
COMMENT ON COLUMN whatsapp_queue.brand IS 'Which white-label storefront this message belongs to — see lib/brands.ts.';
