-- The standalone anyvan_jobs table (free-text driver name, its own rating-request
-- cron) was superseded by real bookings.is_anyvan=true rows, which get the same
-- survey_rating/sendRatingRequest pipeline every other job uses, for free. It had
-- 0 rows in production (confirmed before dropping) — nothing to migrate.
DROP TABLE IF EXISTS anyvan_jobs;
