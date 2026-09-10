## Task: Quote & Deposit follow-up drip messaging

Plan approved: daily follow-ups after a quote is sent (email+SMS+WhatsApp days 1-5, email+WhatsApp days 6-14),
same cadence after a deposit invoice is sent, stopping the instant the customer confirms/pays. 14 days of
silence → booking auto-flagged (`is_flagged`/`flag_reason`, reusing existing unused columns) for admin review.
Full plan: C:\Users\User\.claude\plans\adaptive-conjuring-fox.md

### Plan
- [x] Migration: add drip-tracking columns (`supabase/migrations/add_drip_followups.sql` + mirrored in `scripts/run-migrations.ts`), run it against the live DB.
- [x] `lib/followups/content.ts` — hand-written day-by-day copy (quote sequence: 14 days x up to 3 channels; deposit sequence: same) — warm, human, non-salesy, no fabricated testimonials.
- [x] `lib/followups/engine.ts` — shared runner: computes day number from anchor, sends/queues per channel, flags at day 15.
- [x] `app/api/cron/followup-morning/route.ts` + `app/api/cron/followup-evening/route.ts` (new); delete dead `app/api/cron/quote-followup/route.ts`.
- [x] Wire anchors/resets into `quote/send/route.ts` and `invoices/send/route.ts`.
- [x] `vercel.json` — add the two new crons + functions entries, remove the old quote-followup entry.
- [x] Admin UI: `is_flagged` pill on `app/(admin)/admin/bookings/page.tsx`.
- [x] Typecheck, dry-run against live data, commit, push, deploy, verify live.

### Review
Built two daily crons (`followup-morning` 10am: email always days 1-14 + SMS days 1-5; `followup-evening` 6pm:
WhatsApp queued days 1-14) driving two independent drips — quote (anchored on existing `quote_sent_at`, active
while `status='quote_sent'`) and deposit (new `deposit_followup_started_at` anchor, active while
`status='deposit_invoice_sent'`). Both stop automatically via the existing status-based gating the moment the
customer confirms/pays. 14 days of silence → `is_flagged`/`flag_reason` (reused existing unused columns) +
notification + admin push, no more messages. Content is 66 hand-written messages (2 sequences × 14 days ×
up to 3 channels), each day genuinely different — reassurance, what's-included, the "cheap/careless mover"
pain point, social proof via the real Google review link (no fabricated testimonials), fear-addressing days,
gentle urgency near the end. Old unscheduled 7-step ladder cron deleted as fully superseded.

Found via a read-only check before going live: 88 existing quote_sent + 11 existing deposit_invoice_sent
bookings already in the DB. User chose to backfill `deposit_followup_started_at` for the 11 existing deposits
(from their invoice `sent_at`) so they join the drip too — quote side already had a real anchor. A dry-run
(pure query + day-math, no sends) confirmed the outcome before deploy: 15 quote + 1 deposit booking get an
in-sequence message on the first real run, 70 quote + 7 deposit bookings (most 20-90+ days old) get quietly
flagged for review with zero messages sent — no retroactive spam to old stale leads.

**Watch out for:** the quote-confirm link expiry is a pre-existing hardcoded 48h (`verifyQuoteConfirmToken`,
`app/api/quote-confirm/route.ts`) — fine since a fresh link is generated every single send, but an old day's
email link will 404 if clicked days later. The Supabase `.not(col, "eq", val)` filter silently excludes NULL
rows (NULL = val is NULL/falsy in Postgres) — used `.or(col.is.null, col.lt.val)` instead in both candidate
queries; worth remembering for any future guard-column pattern in this codebase.
