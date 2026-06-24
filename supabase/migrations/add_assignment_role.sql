-- A driver can be assigned to a job as the driver OR as a porter. Each assignment
-- carries its role so the app can show "Your role: Porter" and adjust the actions.
ALTER TABLE booking_driver_assignments
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'driver';  -- 'driver' | 'porter'
