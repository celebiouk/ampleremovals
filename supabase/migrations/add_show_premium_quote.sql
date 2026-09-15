-- Admin can toggle whether a Removals customer ever hears about a Premium
-- option at all. Off = the customer's quote page/email/SMS/WhatsApp show only
-- one price (their Standard total, presented as just "your quote" — no
-- Standard/Premium framing). On (default, unchanged behaviour) = both tiers,
-- Premium highlighted, exactly as today.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS show_premium_quote BOOLEAN NOT NULL DEFAULT TRUE;
