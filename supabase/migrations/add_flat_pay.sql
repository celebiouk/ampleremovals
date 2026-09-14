-- Flat, admin-set-per-assignment pay replaces the %-of-invoice calculation
-- going forward (lib/driver-earnings.ts's calculateDriverEarnings). Existing
-- assignments (made before this change) have flat_pay_amount = NULL, so the
-- old %-of-invoice function keeps working for exactly those — no backfill,
-- no risk to in-flight jobs. Every new assignment sets this at assign-time.

ALTER TABLE booking_driver_assignments ADD COLUMN IF NOT EXISTS flat_pay_amount NUMERIC(10,2);
COMMENT ON COLUMN booking_driver_assignments.flat_pay_amount IS 'Admin-set flat pay for this assignment. NULL = legacy %-of-invoice assignment (see calculateDriverEarnings).';

-- "Pay extra" — an admin top-up on a driver_earnings row that is explicitly
-- exempt from the daily-pay cap (see lib/daily-pay.ts).
ALTER TABLE driver_earnings ADD COLUMN IF NOT EXISTS pay_extra_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
COMMENT ON COLUMN driver_earnings.pay_extra_amount IS 'Admin top-up on top of the daily-pay cap, added by the "Pay extra" action.';
