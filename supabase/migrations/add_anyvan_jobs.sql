-- AnyVan jobs — work with no real customer in this system. Reuses `bookings`
-- (driver/porter assignment, accept/decline, the driver-app job screens,
-- activity log, and admin decline notifications all already work against a
-- booking_id) rather than a parallel table. Never enters the sales pipeline:
-- every automation/cron in this codebase filters on specific statuses, and an
-- AnyVan job's status is never one of those.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_anyvan BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN bookings.is_anyvan IS 'True for a job with no real customer (AnyVan or an approved manual pay request) — admin UI branches on this before showing customer/invoice fields.';

-- New enum value so an AnyVan job's status can never collide with (or be
-- caught by) the real sales pipeline's status filters.
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'anyvan_job';

-- One placeholder customer every AnyVan booking points customer_id at — safer
-- than loosening bookings.customer_id's NOT NULL, since a lot of code assumes
-- a booking's customer join always resolves to a real row.
INSERT INTO customers (id, full_name, email, phone)
SELECT '00000000-0000-0000-0000-000000000001', 'AnyVan (external job)', 'anyvan@internal.ampleremovals.com', '0000000000'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE id = '00000000-0000-0000-0000-000000000001');
