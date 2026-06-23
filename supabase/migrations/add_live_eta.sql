-- Continuously-refreshed ETA: the per-minute cron recomputes this from the
-- driver's latest GPS + live traffic, so the customer sees a real road-based ETA
-- (not a fixed countdown that ticks down even when the driver is stationary).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS current_eta_timestamp TIMESTAMPTZ;
