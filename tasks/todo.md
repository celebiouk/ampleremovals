## Task: Porters in the driver app + flat/AnyVan pay model

Plan approved: full plan at C:\Users\User\.claude\plans\adaptive-conjuring-fox.md

### Plan
- [ ] Migration 1: `drivers.account_type` ('driver'|'porter'); drop unused `porters`/`booking_porter_assignments` tables + their dead API routes.
- [ ] Migration 2: `booking_driver_assignments.flat_pay_amount`; wire `assign-driver` route to use it (write driver_earnings at that amount, not £0); gate `calculateDriverEarnings` on `flat_pay_amount IS NULL`.
- [ ] Migration 3: `bookings.is_anyvan`, new `anyvan_job` status enum value, placeholder "AnyVan (external job)" customer row.
- [ ] Migration 4: `job_pay_requests` table (manual retroactive pay requests).
- [ ] Daily-pay-cap helper (sum today's driver_earnings for a worker vs their day rate) + "Pay extra" field, surfaced at assign/approve time.
- [ ] Admin: "New AnyVan job" form → creates the placeholder booking → existing assign flow.
- [ ] Admin: assign-driver UI takes `flatPayAmount` (+ shows the cap warning), "Reassign" action for declined assignments.
- [ ] Admin: approve/reject UI for `job_pay_requests`.
- [ ] Shared `notifyAdminDeclineEscalated` (email+SMS+WhatsApp+push) called from both respond routes.
- [ ] Driver-app: porter account creation in admin (reuse driver-create form + account_type).
- [ ] Driver-app: `lib/driver-job-view.ts` redacts customer PII for porters on completed jobs.
- [ ] Driver-app: profile ID-card upload; earnings screen gets a date-range picker.
- [ ] Driver-app: manual pay-request screen (date, description, submit).
- [ ] Typecheck (both repos), scripted DB test of the cap logic, commit, push, deploy Next.js side; note driver-app needs the user's own `eas build`.

### Review
Built the full plan: `drivers.account_type` ('driver'|'porter') replaces the unused no-login `porters`
table (0 rows, retired — its API routes deleted, `/admin/porters` repurposed as a filtered view of
driver-app accounts). `booking_driver_assignments.flat_pay_amount` + `driver_earnings.pay_extra_amount`
give every assignment admin-set flat pay going forward (legacy %-of-invoice via
`calculateDriverEarnings` still works untouched for the 28 pre-existing assignments with no flat
amount). `bookings.is_anyvan` + a new `anyvan_job` status enum value + one placeholder customer let
AnyVan jobs reuse the entire existing booking/assignment/accept-decline/driver-app pipeline instead of
a parallel table. `job_pay_requests` handles retroactive pay claims — on approval it creates a minimal
AnyVan-style booking behind the scenes so it flows through the same earnings pipeline too.
`lib/daily-pay.ts` computes the day-rate cap (porters £100/day, AnyVan drivers £150/day default) and
is surfaced as a live preview in the assign-driver modal, defaulting a same-day second job to £0 unless
admin types their own amount or uses the new "Pay extra" action (exempt from the cap by design).
Decline now escalates through email+SMS+WhatsApp+push via a shared `notifyAdminDeclineEscalated` (uses
a freshly-constructed, unpatched Twilio client — the exported singleton's `.messages.create` is
monkey-patched to skip the admin's own number for cost control, which would otherwise silently eat
this alert). Reassigning to someone who declined now works (previously blocked with "already assigned").
Admin gets three new pages: AnyVan Jobs, Pay Requests, and a repurposed Porters page; the assign-driver
modal gets a flat-pay field + cap preview. Driver-app gets a manual pay-request screen, an ID-card photo
upload (distinct from driving-licence fields, which don't apply to porters), and a custom date-range
earnings picker.

One requirement turned out to already be fully built: `lib/driver-job-view.ts` already redacts
customer name/address/phone/email for EVERY driver (not just porters) once a job is completed — nothing
needed there.

Verified: all 4 new/changed migrations applied live (`account_type`, `flat_pay_amount`, `is_anyvan` +
enum value + placeholder customer, `job_pay_requests`, `id_card_url`); a scripted end-to-end test
against the real DB confirmed the cap logic exactly (£100 day rate → second same-day job defaults to
£0 → pay-extra correctly exempt from the cap → a different day resets the cap), then cleaned up.
Driver-app typechecks clean on its own tsconfig; main-repo typecheck shows only pre-existing baseline
noise, none of it in any file this task touched.

**Watch out for:** driver-app changes need the user's own `eas build` to reach devices (no OTA channel
configured). The decline-escalation WhatsApp send is free-form text to the admin's own number — per
Twilio's WhatsApp Business rules this only reliably works inside a 24h customer-initiated window unless
sent via an approved template; email + SMS are the channels to trust for this alert until/unless a
template gets approved. The root `tsconfig.json` doesn't exclude `driver-app/` (only `node_modules`,
`scripts`, `admin-app` are excluded), so a root `npx tsc --noEmit` incidentally sweeps in driver-app
files under the wrong (Next.js) tsconfig and reports spurious errors there — always verify driver-app
separately with `cd driver-app && npx tsc --noEmit`, which is what its own tsconfig is for. This is
pre-existing, not something this task introduced or fixed.
