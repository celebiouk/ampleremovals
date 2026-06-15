-- Coordinates on addresses — REQUIRED by the driver app.
--
-- The driver jobs API selects addresses(... lat, lng) for the map + 80m arrival
-- detection. These columns were assumed during the driver-app build but never
-- actually created, so that query 500s ("column addresses.lat does not exist")
-- as soon as a driver has an assigned job. Adding them (nullable) fixes it.
--
-- New bookings geocode the postcode on creation; run the backfill route
-- (POST /api/admin/addresses/geocode-missing) to fill any existing rows.

ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS lat NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(10,7);
