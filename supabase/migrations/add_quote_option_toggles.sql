-- Three independent quote options an admin can mix and match when sending a
-- Removals quote: Standard (fixed price), Premium (fixed price, already had
-- its own show_premium_quote toggle), and Hourly (a rate, not a fixed total —
-- "£75/hr for 2 men & a van"). Any combination can be sent, including Hourly
-- on its own with both fixed-price tiers off.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS show_standard_quote BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS show_hourly_quote BOOLEAN NOT NULL DEFAULT FALSE;
