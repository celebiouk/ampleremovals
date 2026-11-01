-- Dedicated guard column for the "running late" (in-transit) notice sent by
-- app/api/cron/late-check/route.ts. Previously this cron deduped by checking
-- for a prior activity_log row, then sending, then inserting that row — three
-- separate steps with no atomicity between the check and the write, the same
-- bug class that caused app/api/cron/eta-engine (late-start.ts) to send one
-- customer 900+ duplicate "driver running late" messages over 15 hours. This
-- column lets the cron CLAIM the booking atomically (UPDATE ... WHERE column
-- IS NULL ... RETURNING) before sending anything.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS late_notice_sent_at TIMESTAMPTZ;
COMMENT ON COLUMN bookings.late_notice_sent_at IS 'Set atomically when the in-transit "running late" notice (late-check cron) is sent, to prevent duplicate sends.';
