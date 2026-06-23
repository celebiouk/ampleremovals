-- Continuously-refreshed ETA, kept cheap:
--  • current_eta_timestamp  — the live ETA the tracking page shows
--  • eta_calc_at            — when we last called Google (throttle to ~10 min)
--  • eta_last_lat/lng       — driver position at that last call (detect "parked")
--  • eta_last_duration_seconds — last drive duration, to hold the ETA steady for
--                                free while the driver isn't moving (no API call)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS current_eta_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eta_calc_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eta_last_lat NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS eta_last_lng NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS eta_last_duration_seconds INTEGER;
