-- New booking_status enum values for the quote flow.
--
-- bookings.status is a Postgres ENUM (booking_status), so the two new statuses
-- must be added to the type BEFORE any column/index/row uses them.
--
-- IMPORTANT: run this file ON ITS OWN, first. Postgres will not let a newly
-- added enum value be *used* in the same transaction it was added — so this must
-- commit before add_quote_followup_v2.sql (whose index references 'quote_sent')
-- and before the app writes those statuses.

ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'quote_sent' BEFORE 'deposit_invoice_sent';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'quote_confirmed' BEFORE 'deposit_invoice_sent';
