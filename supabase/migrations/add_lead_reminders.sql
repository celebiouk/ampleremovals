-- New-lead reminder ladder. Partial leads (is_partial_lead = true) that a
-- customer hasn't completed get chased at 2h / 7h / 24h / 72h / 5 days, then stop.
-- Additive + idempotent.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS lead_reminder_stage INT DEFAULT 0,   -- 0..5 reminders sent
  ADD COLUMN IF NOT EXISTS lead_last_reminder_at TIMESTAMPTZ;   -- when the last one went out
