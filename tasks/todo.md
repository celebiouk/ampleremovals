## Task: Fix driver ETA notifications (30/20/10/5-min checkpoints)

Confirmed via `journey_eta_log` (832 rows): only "journey_started" and "arrived" have ever fired —
20-min/10-min checkpoints have NEVER fired in production. Root cause candidate: the live GPS-based
distance-matrix duration used to gate each checkpoint can go stale (driver position not advancing
between polls) and the old retry-forever logic just waits indefinitely instead of degrading gracefully.
User decided: (1) make it resilient to stale GPS rather than deep-diving the driver app's background
location task, (2) expand from 2 checkpoints (20/10-min) to 4 (30/20/10/5-min) in the same pass.

Also fixed en route: unscheduled a stale Supabase pg_cron job (`quote-followup`) left over from the
previous drip-messaging task — it was hitting a 404 hourly since that route was deleted without checking
pg_cron. Already committed (eecd209) and applied live.

### Plan
- [ ] Migration: add `call4_*`/`scheduled_call4_time` + `call5_*`/`scheduled_call5_time` columns to `bookings` (call2/call3 get repurposed in *meaning* — 30-min/20-min — no schema change needed for those, since they've never successfully fired in prod).
- [ ] Rewrite `lib/driver-eta.ts`: generalize the 2-stage ladder into a 4-stage table (30/20/10/5-min), single cascading `processCall` that skips forward through stages in one pass when the driver's already closer than expected (no wasted cron minutes). Add the staleness fallback: if the driver's GPS fix is older than ~4 min, use the ORIGINAL Call-1 ETA (wall-clock) to judge whether a checkpoint is due, instead of trusting a frozen live duration — so a checkpoint always eventually fires near the right time even if GPS never updates again.
- [ ] `lib/driver-notify.ts`: add `"30min"` / `"5min"` to `JourneyEvent`, write email/SMS/WhatsApp copy for both (matching the existing 20min/10min tone).
- [ ] `lib/whatsapp-templates.ts`: add `driver_30_mins_away` / `driver_5_mins_away` title entries (contentSid unused, per the existing pattern — WhatsApp is queued, never auto-sent via the Twilio API).
- [ ] Typecheck, dry-run the cascading logic against a few synthetic scenarios (fresh GPS in-window, fresh GPS too-far, stale GPS past the window), commit, push (no Vercel deploy needed if this only touches `lib/`/route logic already covered by existing deploys — confirm which files actually need a fresh prod deploy), verify against a real or synthetic in-progress job.

### Review
Rewrote `lib/driver-eta.ts`'s mid-journey checkpoint logic as a table-driven cascade (`STAGES`:
30/20/10/5-min, each with a fire window + retry interval) instead of two hand-written call2/call3
branches. A single `processCall` walks forward through any stages the driver's already passed
using the same GPS reading (no wasted cron minute per stage on a short/fast leg), and — the actual
bug fix — checks GPS freshness (`driver_locations.updated_at` < 4 min old) before trusting a live
distance-matrix duration; when GPS is stale it falls back to a wall-clock estimate from the original
Call-1 ETA, so a checkpoint still fires near the right time even if the driver app's background
location never updates again (which is what silently broke every 20-min/10-min notification in
production — confirmed via `journey_eta_log`: 0 fires in 832 rows, only journey_started/arrived).
`call2`/`call3` columns are reused with new meaning (30-min/20-min instead of 20-min/10-min) since
they never carried real fired data; `call4`/`call5` are new columns for 10-min/5-min. Added matching
copy + WhatsApp template entries in `lib/driver-notify.ts`/`lib/whatsapp-templates.ts`. Confirmed the
driver app only calls the smart-ETA engine (`journey/start` + `arrived`) — the older manual
`twenty_mins_away`/`ten_mins_away` status route is dead code, left untouched. Verified no journey was
active at deploy time (0 rows with `current_journey_leg` set), so no live job could be disrupted by
the call2/call3 meaning change.

**Watch out for:** if a future investigation wants the GPS root cause (why background location
sometimes freezes for 20+ minutes), the 4-minute staleness fallback in this fix will mask it —
`journey_eta_log`'s `duration_seconds_returned` next to `driver_locations.updated_at` at the time is
the place to look. Also fixed en route: unscheduled a stale Supabase pg_cron job (`quote-followup`,
eecd209) that the previous drip-messaging task broke by deleting its route without checking pg_cron —
lesson logged in `tasks/lessons.md`.
