-- ============================================================
-- PHASE 11B: Driver RLS Hardening
-- ============================================================
-- Problem: the base schema grants `FOR ALL TO authenticated
-- USING (true)` on customer-data and driver tables. Before drivers
-- existed, "authenticated" meant "admin", so this was safe. Now that
-- drivers authenticate too, that policy lets ANY logged-in driver read
-- every customer, booking, invoice, and other drivers' earnings via the
-- browser client.
--
-- Fix:
--   1. Helper functions to identify the current driver (SECURITY DEFINER
--      so they bypass RLS and can't recurse).
--   2. Redefine the broad admin policies to exclude drivers — admins are
--      authenticated users with NO driver row, so they keep full access;
--      drivers are cut off. (Admin server routes use the service role and
--      bypass RLS regardless.)
--   3. Add narrow driver-scoped SELECT policies so drivers still see the
--      bookings/customers/addresses for jobs they're assigned to.
-- ============================================================

-- ── Helper functions ──────────────────────────────────────

-- The driver id linked to the current auth user (NULL if not a driver).
CREATE OR REPLACE FUNCTION public.current_driver_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.drivers WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- True when the current auth user is a driver.
CREATE OR REPLACE FUNCTION public.is_driver_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.drivers WHERE auth_user_id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.current_driver_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_driver_user() TO authenticated, anon;

-- ── 1. Tighten broad admin policies on customer-data tables ──
-- Redefine "Admins have full access" to exclude drivers. The public
-- anon-insert policies and anon read-by-id policies are left untouched.

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'customers','addresses','bookings','removals_details','man_and_van_details',
    'house_clearance_details','house_cleaning_details','end_of_tenancy_details',
    'additional_services','booking_notes','status_history','activity_log',
    'invoices','payments','server_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins have full access" ON %I;', t);
    EXECUTE format(
      'CREATE POLICY "Admins have full access" ON %I FOR ALL TO authenticated '
      || 'USING (NOT public.is_driver_user()) WITH CHECK (NOT public.is_driver_user());',
      t
    );
  END LOOP;
END $$;

-- Drop alternate authenticated-full-access policy names that may exist on
-- invoices/payments from earlier schema variants (the admin policy above
-- now covers admins; anon read-by-id policies stay in place).
DROP POLICY IF EXISTS "Authenticated full access to invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated full access to payments" ON payments;

-- ── 2. Tighten broad admin policies on driver tables ────────
-- These were created by add_drivers.sql as `TO authenticated USING (true)`,
-- which lets one driver read every other driver's records. Exclude drivers;
-- the existing "Drivers can ... own" policies keep self-access working.

DROP POLICY IF EXISTS "Admins full access to drivers" ON drivers;
CREATE POLICY "Admins full access to drivers"
  ON drivers FOR ALL TO authenticated
  USING (NOT public.is_driver_user()) WITH CHECK (NOT public.is_driver_user());

DROP POLICY IF EXISTS "Admins full access to assignments" ON booking_driver_assignments;
CREATE POLICY "Admins full access to assignments"
  ON booking_driver_assignments FOR ALL TO authenticated
  USING (NOT public.is_driver_user()) WITH CHECK (NOT public.is_driver_user());

DROP POLICY IF EXISTS "Admins full access to job status updates" ON driver_job_status_updates;
CREATE POLICY "Admins full access to job status updates"
  ON driver_job_status_updates FOR ALL TO authenticated
  USING (NOT public.is_driver_user()) WITH CHECK (NOT public.is_driver_user());

DROP POLICY IF EXISTS "Admins full access to driver_earnings" ON driver_earnings;
CREATE POLICY "Admins full access to driver_earnings"
  ON driver_earnings FOR ALL TO authenticated
  USING (NOT public.is_driver_user()) WITH CHECK (NOT public.is_driver_user());

DROP POLICY IF EXISTS "Admins full access to driver_tips" ON driver_tips;
CREATE POLICY "Admins full access to driver_tips"
  ON driver_tips FOR ALL TO authenticated
  USING (NOT public.is_driver_user()) WITH CHECK (NOT public.is_driver_user());

-- ── 3. Driver-scoped read policies ──────────────────────────
-- Drivers may read only the bookings they're assigned to, and the
-- customers/addresses attached to those bookings.

DROP POLICY IF EXISTS "Drivers read assigned bookings" ON bookings;
CREATE POLICY "Drivers read assigned bookings"
  ON bookings FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT booking_id FROM booking_driver_assignments
      WHERE driver_id = public.current_driver_id()
    )
  );

DROP POLICY IF EXISTS "Drivers read assigned customers" ON customers;
CREATE POLICY "Drivers read assigned customers"
  ON customers FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT customer_id FROM bookings
      WHERE id IN (
        SELECT booking_id FROM booking_driver_assignments
        WHERE driver_id = public.current_driver_id()
      )
    )
  );

DROP POLICY IF EXISTS "Drivers read assigned addresses" ON addresses;
CREATE POLICY "Drivers read assigned addresses"
  ON addresses FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT origin_address_id FROM bookings
      WHERE id IN (
        SELECT booking_id FROM booking_driver_assignments
        WHERE driver_id = public.current_driver_id()
      )
      UNION
      SELECT destination_address_id FROM bookings
      WHERE id IN (
        SELECT booking_id FROM booking_driver_assignments
        WHERE driver_id = public.current_driver_id()
      )
    )
  );
