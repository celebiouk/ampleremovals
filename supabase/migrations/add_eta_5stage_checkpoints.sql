-- Smart-ETA engine: expand from 2 mid-journey checkpoints (20min/10min, which
-- never once fired successfully in production — see journey_eta_log) to 4
-- (30min/20min/10min/5min), and add the staleness fallback support.
--
-- call2_*/scheduled_call2_time and call3_*/scheduled_call3_time already exist
-- and are simply REPURPOSED in meaning (30-min and 20-min respectively, was
-- 20-min and 10-min) — safe because they've never carried real fired data.
-- call4/call5 are new: 10-min and 5-min.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS scheduled_call4_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call4_eta_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call4_duration_seconds INT,
  ADD COLUMN IF NOT EXISTS call4_notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scheduled_call5_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call5_eta_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call5_duration_seconds INT,
  ADD COLUMN IF NOT EXISTS call5_notification_sent BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN bookings.scheduled_call4_time IS 'Smart-ETA: when to next check the 10-min checkpoint.';
COMMENT ON COLUMN bookings.scheduled_call5_time IS 'Smart-ETA: when to next check the 5-min checkpoint.';
