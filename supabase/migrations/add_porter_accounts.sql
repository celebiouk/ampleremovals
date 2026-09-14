-- Porters get real driver-app accounts (login, push, profile) instead of the
-- unused no-login `porters` table. `account_type` marks what kind of person a
-- driver-app account is; `booking_driver_assignments.role` (already exists,
-- add_assignment_role.sql) still records the role PER JOB, so a driver
-- account can occasionally be used as a porter on one job if ever needed.

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'driver'
  CHECK (account_type IN ('driver', 'porter'));

-- ID card photo (passport/ID card) — distinct from driving_licence_*, which
-- doesn't apply to a porter (they don't drive).
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS id_card_url TEXT;

-- Retire the standalone no-login porter system — confirmed 0 rows in both
-- tables and no references from any live UI before dropping.
DROP TABLE IF EXISTS booking_porter_assignments;
DROP TABLE IF EXISTS porters;
