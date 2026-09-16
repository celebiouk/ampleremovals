-- "processing" removed entirely at the user's request (it displayed as
-- "Pending", the same label as the now-deleted "pending" value, and was
-- confusing for the same reason). The one live booking on it moves to
-- "not_a_good_fit" (explicit instruction), and both status_history rows
-- that ever recorded a transition into "processing" are remapped the
-- same way so nothing is left pointing at the value being dropped.

UPDATE bookings SET status = 'not_a_good_fit' WHERE status = 'processing';

INSERT INTO status_history (booking_id, previous_status, new_status, changed_by)
SELECT id, 'processing', 'not_a_good_fit', 'system' FROM bookings WHERE id = '52730954-4fe4-4d83-be7a-0d49b56a97a7';

INSERT INTO activity_log (booking_id, action, metadata, performed_by)
VALUES ('52730954-4fe4-4d83-be7a-0d49b56a97a7', 'Status consolidated: processing -> not_a_good_fit',
  '{"reason":"\"processing\" status removed entirely (duplicate \"Pending\" label); admin chose not_a_good_fit as the replacement for this booking"}',
  'system');

UPDATE status_history SET new_status = 'not_a_good_fit' WHERE new_status = 'processing';
UPDATE status_history SET previous_status = 'not_a_good_fit' WHERE previous_status = 'processing';

DROP INDEX IF EXISTS idx_bookings_inactivity_alerts;
DROP INDEX IF EXISTS idx_bookings_seven_day_countdown;
DROP INDEX IF EXISTS idx_bookings_five_day_countdown;
DROP INDEX IF EXISTS idx_bookings_move_date_reminders;
DROP INDEX IF EXISTS idx_bookings_weather_alerts;
DROP INDEX IF EXISTS idx_bookings_quote_ladder;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_bookings_quote_drip;
DROP INDEX IF EXISTS idx_bookings_deposit_drip;
DROP INDEX IF EXISTS idx_bookings_anniversaries;

CREATE TYPE booking_status_new AS ENUM (
  'inquiry', 'called', 'not_called', 'answered', 'not_answered',
  'quote_sent', 'quote_confirmed', 'deposit_invoice_sent',
  'deposit_paid_job_confirmed', 'full_invoice_sent', 'full_balance_paid',
  'job_completed', 'bad_lead', 'not_a_good_fit', 'anyvan_job'
);

ALTER TABLE bookings ALTER COLUMN status DROP DEFAULT;
ALTER TABLE bookings ALTER COLUMN status TYPE booking_status_new USING status::text::booking_status_new;
ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'inquiry'::booking_status_new;

ALTER TABLE status_history ALTER COLUMN previous_status TYPE booking_status_new USING previous_status::text::booking_status_new;
ALTER TABLE status_history ALTER COLUMN new_status TYPE booking_status_new USING new_status::text::booking_status_new;

DROP TYPE booking_status;
ALTER TYPE booking_status_new RENAME TO booking_status;

CREATE INDEX idx_bookings_inactivity_alerts ON public.bookings USING btree (created_at, status) WHERE ((status = ANY (ARRAY['inquiry'::booking_status, 'called'::booking_status, 'not_called'::booking_status, 'answered'::booking_status])) AND (inactivity_alert_sent = false));

CREATE INDEX idx_bookings_seven_day_countdown ON public.bookings USING btree (move_date) WHERE ((move_date IS NOT NULL) AND (status = 'deposit_paid_job_confirmed'::booking_status) AND (seven_day_reminder_sent_at IS NULL));

CREATE INDEX idx_bookings_five_day_countdown ON public.bookings USING btree (move_date) WHERE ((move_date IS NOT NULL) AND (status = 'deposit_paid_job_confirmed'::booking_status) AND (five_day_reminder_sent_at IS NULL));

CREATE INDEX idx_bookings_move_date_reminders ON public.bookings USING btree (move_date) WHERE ((move_date IS NOT NULL) AND (status = 'deposit_paid_job_confirmed'::booking_status));

CREATE INDEX idx_bookings_weather_alerts ON public.bookings USING btree (move_date) WHERE ((move_date IS NOT NULL) AND (weather_alert_sent_at IS NULL) AND (status = 'deposit_paid_job_confirmed'::booking_status));

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);

CREATE INDEX idx_bookings_quote_drip ON public.bookings USING btree (status, is_flagged, quote_followup_last_morning_sent_on, quote_followup_last_evening_sent_on) WHERE (status = 'quote_sent'::booking_status);

CREATE INDEX idx_bookings_deposit_drip ON public.bookings USING btree (status, is_flagged, deposit_followup_last_morning_sent_on, deposit_followup_last_evening_sent_on) WHERE (status = 'deposit_invoice_sent'::booking_status);

CREATE INDEX idx_bookings_anniversaries ON public.bookings USING btree (move_date) WHERE ((move_date IS NOT NULL) AND (status = 'job_completed'::booking_status) AND (anniversary_email_sent_at IS NULL));

CREATE INDEX idx_bookings_quote_ladder ON public.bookings USING btree (status, quote_followup_stage, quote_last_followup_at) WHERE (status = 'quote_sent'::booking_status);
