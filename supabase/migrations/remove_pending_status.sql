-- "pending" and "processing" have always displayed identically ("Pending")
-- and the app stopped offering "pending" as a choice (see ALL_STATUSES in
-- lib/constants.ts). It has 0 live bookings, so it's now removed from the
-- booking_status enum entirely rather than just hidden from the dropdown.
-- Postgres enums can't drop a value directly, so the type is recreated
-- without it and swapped in on the two columns that use it. Every partial
-- index whose WHERE clause references the old type has to be dropped first
-- and recreated after (the ones that filtered on 'pending' now just filter
-- on 'processing', its display-equivalent, without it).

-- One historical status_history row recorded a real transition into
-- "pending" back when that value was still in use; remap it to
-- "processing" (the value pending was always a duplicate of) so nothing
-- is left pointing at the value being dropped.
UPDATE status_history SET new_status = 'processing' WHERE new_status = 'pending';
UPDATE status_history SET previous_status = 'processing' WHERE previous_status = 'pending';

DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_bookings_quote_drip;
DROP INDEX IF EXISTS idx_bookings_deposit_drip;
DROP INDEX IF EXISTS idx_bookings_anniversaries;
DROP INDEX IF EXISTS idx_bookings_inactivity_alerts;
DROP INDEX IF EXISTS idx_bookings_seven_day_countdown;
DROP INDEX IF EXISTS idx_bookings_five_day_countdown;
DROP INDEX IF EXISTS idx_bookings_move_date_reminders;
DROP INDEX IF EXISTS idx_bookings_weather_alerts;
DROP INDEX IF EXISTS idx_bookings_quote_ladder;

CREATE TYPE booking_status_new AS ENUM (
  'inquiry', 'called', 'not_called', 'answered', 'not_answered',
  'processing', 'quote_sent', 'quote_confirmed', 'deposit_invoice_sent',
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

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);

CREATE INDEX idx_bookings_quote_drip ON public.bookings USING btree (status, is_flagged, quote_followup_last_morning_sent_on, quote_followup_last_evening_sent_on) WHERE (status = 'quote_sent'::booking_status);

CREATE INDEX idx_bookings_deposit_drip ON public.bookings USING btree (status, is_flagged, deposit_followup_last_morning_sent_on, deposit_followup_last_evening_sent_on) WHERE (status = 'deposit_invoice_sent'::booking_status);

CREATE INDEX idx_bookings_anniversaries ON public.bookings USING btree (move_date) WHERE ((move_date IS NOT NULL) AND (status = 'job_completed'::booking_status) AND (anniversary_email_sent_at IS NULL));

CREATE INDEX idx_bookings_inactivity_alerts ON public.bookings USING btree (created_at, status) WHERE ((status = ANY (ARRAY['inquiry'::booking_status, 'called'::booking_status, 'not_called'::booking_status, 'answered'::booking_status, 'processing'::booking_status])) AND (inactivity_alert_sent = false));

CREATE INDEX idx_bookings_seven_day_countdown ON public.bookings USING btree (move_date) WHERE ((move_date IS NOT NULL) AND (status = ANY (ARRAY['deposit_paid_job_confirmed'::booking_status, 'processing'::booking_status])) AND (seven_day_reminder_sent_at IS NULL));

CREATE INDEX idx_bookings_five_day_countdown ON public.bookings USING btree (move_date) WHERE ((move_date IS NOT NULL) AND (status = ANY (ARRAY['deposit_paid_job_confirmed'::booking_status, 'processing'::booking_status])) AND (five_day_reminder_sent_at IS NULL));

CREATE INDEX idx_bookings_move_date_reminders ON public.bookings USING btree (move_date) WHERE ((move_date IS NOT NULL) AND (status = ANY (ARRAY['deposit_paid_job_confirmed'::booking_status, 'processing'::booking_status])));

CREATE INDEX idx_bookings_weather_alerts ON public.bookings USING btree (move_date) WHERE ((move_date IS NOT NULL) AND (weather_alert_sent_at IS NULL) AND (status = ANY (ARRAY['deposit_paid_job_confirmed'::booking_status, 'processing'::booking_status])));

CREATE INDEX idx_bookings_quote_ladder ON public.bookings USING btree (status, quote_followup_stage, quote_last_followup_at) WHERE (status = 'quote_sent'::booking_status);
