## Task: Merge the two duplicate "AnyVan Jobs" nav items into one real system

### Context
Sidebar showed two identically-labelled "AnyVan Jobs" entries doing unrelated
things: `/admin/anyvan` was an old standalone form (free-text driver name, its
own `anyvan_jobs` table, its own 48h-rating-request cron) that had actually
gone dead — its POST/GET to `/api/admin/anyvan-jobs` no longer matched what
that route does, since the route had already been rewritten for the newer
`/admin/anyvan-jobs` system (real `bookings` rows, `is_anyvan: true`, real
driver/porter assignment via the existing flat-pay flow). The old page was
never removed from the nav after the new one replaced it. Confirmed the
standalone table had 0 rows in production before touching anything.

### Plan
- [x] Confirm the standalone `anyvan_jobs` table is empty and nothing else
      depends on it (checked FKs/triggers — only standard RI constraints).
- [x] Delete the dead files: `/admin/anyvan` page, `/api/anyvan/rate`,
      `/api/cron/anyvan-rating-requests`, `/api/drivers/anyvan-jobs`,
      `lib/anyvan-rating.ts`, `/anyvan-rate/[id]` public landing page.
- [x] Remove its cron entry from `vercel.json` (also frees a slot under the
      Hobby-plan daily cron limit, per Lesson 16).
- [x] Remove the duplicate nav entry in `AdminShell.tsx`.
- [x] Write (but hold, pending approval) a migration to `DROP TABLE
      anyvan_jobs` — blocked by the sandbox's destructive-SQL guard, needs
      the user's explicit go-ahead to actually run.
- [x] Upgrade the real `/admin/anyvan-jobs` page to cover what the old one
      did, properly this time: show assigned driver/porter per job, show the
      rating once left (reusing `bookings.survey_rating` — the SAME column
      and pipeline every other booking already uses, so AnyVan ratings now
      surface on a driver's profile too, which they never did before), and a
      "Mark complete" action.
- [x] New `/api/admin/anyvan-jobs/[id]/complete` — an AnyVan job has no real
      addresses/journey, so the driver-app's own Complete button (gated on
      `delivery_confirmed` from the journey tracker) can never fire for one.
      This mirrors the same completion sequence admin-side and calls the
      existing `sendRatingRequest()` unchanged.
- [x] Nudge admin when a job still points at the shared placeholder customer
      (no real name/phone/email) — a rating request would have nowhere real
      to go. Doesn't block, just warns, since the booking detail page already
      has a full customer editor to fix it (reused, not rebuilt).

### Review
What was done: removed an entire duplicate, dead system (6 files, 1 table,
1 cron) rather than just relabelling the nav, and made the surviving system
actually richer by connecting it to infrastructure that already existed
(the real survey/rating pipeline, the real driver-assignment flow) instead
of maintaining a second bespoke version of both. Verified the new list query
against live data before shipping (shows a real driver+porter pair
correctly). 136 pre-existing typecheck errors unchanged.

Left outstanding: `DROP TABLE anyvan_jobs` itself — written as a migration,
confirmed safe (0 rows), but blocked by an auto-mode safety classifier for
destructive SQL. Needs the user to either approve a retry or run it
themselves. Not urgent — the table is empty and nothing references it, so
it's inert until dropped.
