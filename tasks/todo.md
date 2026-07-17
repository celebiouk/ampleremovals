# New Lead management + paste-to-prefill ✅ (dedup: email OR phone)
# Built: migration (lead_reminder_stage/at) applied; dedup + GET /api/admin/leads
# + manual remind + hourly cron ladder (2h/7h/24h/72h/5d); parseLeadMessage;
# web + mobile New Lead paste box + pending-leads list w/ reminders. Routes
# verified (auth-guarded 401/307); parser verified against the sample.
# (original plan below)

# PLAN (done): New Lead management + paste-to-prefill

## A. New Lead list + dedup + reminders
- **Migration**: on bookings add `lead_reminder_stage INT DEFAULT 0`,
  `lead_last_reminder_at TIMESTAMPTZ`. (is_partial_lead already exists.)
- **Dedup** (`/api/admin/leads/create`): before creating, if a partial lead
  (is_partial_lead=true) already exists for the same email/phone → return
  "already added" + the existing completion link, don't create a duplicate.
- **New Lead list**: `GET /api/admin/leads` → partial leads (is_partial_lead=true)
  with customer, created_at, reminder stage. Shown BELOW the New Lead form on
  web (/admin/leads/new) and mobile (lead/new). Each row: name/email/phone,
  "sent N reminders", copy link, **Send reminder** button.
- **Auto-move to Bookings**: completeLead already flips is_partial_lead=false, so
  a completed lead drops off the list and appears in Bookings automatically. ✓
- **Reminder automation**: cron `/api/cron/lead-reminders` (Vercel cron ~every
  30 min): for partial leads, send the due reminder (email+SMS+WhatsApp) at
  **2h / 7h / 24h / 72h / 5 days** after creation (lead_reminder_stage 1..5),
  then STOP after 5 days (lead stays in the list). Register in vercel.json.
- **Manual reminder**: `POST /api/admin/leads/[id]/remind` → send now (button).

## B. Paste-to-prefill New Lead
- `lib/parseLeadMessage.ts`: extract Name / email / Phone Number from a pasted
  lead message (regex on the "Label: value" lines). Tolerant of the sample format.
- Web + mobile New Lead: a "Paste lead message" box → "Extract & prefill" fills
  the name/email/phone fields; the normal manual form stays exactly as-is.

## Open question
- Dedup key: match duplicates on **email**, **phone**, or **either**?

---

# Task: Deposit lifecycle (reserve → invoice sent → claimed → admin confirms) ✅
1. [x] Reserve → status `deposit_invoice_sent` + send deposit request (amount, bank
       details, reference) by email + SMS + WhatsApp (sendDepositMessages). Quote page
       resumes at the deposit screen if the customer returns via the link.
2. [x] "I've made the payment" → deposit_status=claimed (existing) + admin booking page
       shows an amber "customer says they've paid — Confirm Deposit" banner + button.
3. [x] Admin "Confirm Deposit" → /api/admin/bookings/[id]/confirm-deposit: status
       `deposit_paid_job_confirmed`, deposit_status=verified, notify customer "Ample
       Removals has confirmed your deposit" (email + SMS + WhatsApp).
Verified live: 7/7 (reserve→deposit_invoice_sent, recompute, claim, admin-guard).

# Task: Post-quote lifecycle + full detail visibility (follow-up) ✅

### Plan
1. [x] Instant quote generated → status `quote_sent` ("Quote Sent to Customer") +
       status_history + activity + quote follow-up ladder started (markQuoteSent).
2. [x] Quote sent by email + SMS + WhatsApp with a "Reserve My Moving Date" link to
       /quote/[id]/[token] — covers abandoned browsers.
3. [x] Admin notified when a lead completes (sendAdminNewBookingEmail in /leads/complete).
4. [x] Messaging reworded → "reserve your date — you can change it later".
5. [x] Admin booking detail shows inventory, floor/lift/parking/special-instructions,
       and add-on quantities.
6. [x] Driver job screen shows Access + "What you're moving" (+ fields on driver Job type).
Verified live E2E: 17/17 (status transitions, persistence, reserve recompute, deposit).
Fixed: status_history has no `reason` column — removed it from the insert.

---

# Task: Lead → Instant Quote → Reserve → Deposit (Removals + Man & Van)

Goal: one automatic flow for both admin-created leads and organic website bookings.
Ends in an editable instant quote → "Reserve My Moving Date" → 25% **bank-transfer**
deposit (customer self-declares "I've paid" → team verifies). Reduce manual work.

### Locked decisions
- Scope: **Removals only** for the auto-quote (Man & Van auto-quote deferred — keeps
  its existing manual flow for now).
- Removals price (no white goods / with): studio 400/450, 1-bed 450/500, 2-bed 500/550,
  3-bed 550/600, 4-bed 600/650, 5+ 650/700. White goods = **flat +£50, hidden**, folded
  into base line (not removable, not shown).
- Man & Van = **flat by van size** (small/medium/large) — PRICES PENDING from owner.
- Packing = **£35/hr**, customer picks hours. Dismantle/Assemble = **£20/item**, ask qty.
- EOT cleaning add-on = by bedroom (2-bed £200, 3-bed £250, +£50/bed; rest extrapolated).
- Deposit = **25%**, paid by **manual bank transfer**. Customer clicks "I've made payment"
  → status = deposit claimed (pending team verification) → "team will be in touch" screen.
- "Parking within 20m" = unpaid **access question** (not a paid service).

### Pending inputs from owner
- [x] ~~Man & Van prices~~ — auto-quote deferred, not needed for now.
- [x] Bank details — RECEIVED (Ample Logistics Limited, 30-54-66, 12963462) → in env.
- [ ] `DATABASE_URL` in .env.local so I can APPLY the migration automatically.
- [ ] Confirm EOT extrapolated bands + studio/1-bed removals bands (currently assumed).

### Plan
**Phase A — Foundation (server, testable now)**
- [x] `lib/quote-engine.ts` — instant quote + 25% deposit (Removals only, verified).
- [x] `lib/inventory-catalog.ts` — item template taxonomy + white-goods detection.
- [x] Migration `add_instant_quote_lead_flow.sql` written + added to run-migrations.ts.
      ⚠ NOT YET APPLIED — needs `DATABASE_URL`.
- [x] Extended booking Zod schema + `createBooking`: persists floor/lift/parking/
      special-instructions/inventory, derives `has_white_goods`, computes & stores the
      quote + `deposit_amount` (best-effort, tolerant of the un-applied migration).
- [x] Bank details wired into env (.env.local + .env.example).
**Phase B — Capture UI (web wizard)** ✅ (Removals)
- [x] `InventoryStep` — item template (5 categories, variants, quantities). Quiet
      tap-to-add rows (QuantityStepper collapses to a single ＋ at 0) so it feels fast.
- [x] `AccessStep` — ground/upstairs + floor level, lift, parking-within-20m, special
      instructions. All optional.
- [x] `ExtraHelpStep` — packing hours (£35/hr) + dismantle/assemble counts (£20/item)
      + packing materials; keeps `additionalServices` booleans in sync.
- [x] Wired into the Removals wizard (13 steps) + review sections; ReviewStep renders
      the inventory summary + add-on quantities. Route compiles + renders (HTTP 200).
- [ ] Man & Van capture (deferred with its auto-quote).
**Phase C — Instant quote experience (web)** ✅
- [x] Quote page `/quote/[bookingId]/[token]` (token-secured, no login).
- [x] ~5s "getting you the best quote" loading screen (animated, rotating messages).
- [x] Editable quote reveal — remove/re-add removable lines (✕/＋), live total + deposit;
      white-goods uplift stays hidden in the non-removable base line.
- [x] "Reserve My Moving Date" → `/api/quote/reserve` recomputes server-side → status
      `quote_confirmed` + status_history + activity_log.
- [x] Deposit screen: bank details (Ample Logistics, from env) + reference + "I've made
      the payment" → `/api/deposit/claim` (deposit_status=claimed, alerts team to verify).
- [x] "A team member will be in touch" thank-you + call button. Organic Removals bookings
      now route here (useBookingForm); other services keep /confirmation.
- [x] createBooking split so the quote persists into existing columns pre-migration.
      Verified: page renders, routes compile + reject bad tokens (401). Full happy-path
      E2E pending the migration + a real submission (avoided polluting prod).
**Phase D — Admin "New Lead" + self-serve completion link** ✅
- [x] Admin web `New Lead` page (name/email/phone → Complete) + nav entry (AdminShell)
      + `/api/admin/leads/create` (requireAdmin; creates partial lead; shows link).
- [x] Tri-channel invite `lib/lead-invite.ts` (email + SMS + WhatsApp free-text).
      TODO: add a `lead_details_request` WhatsApp template for guaranteed delivery.
- [x] `/complete/[bookingId]/[token]` page — verifies token server-side, greets by
      name, renders the Removals wizard in COMPLETION mode (CompletionFlow) with
      contact pre-filled; submit → `/api/leads/complete` → `completeLead` updates the
      existing booking + quote → routes to the quote page. Reuses lib/tokens HMAC.
- [x] WizardConfig.completion + useBookingForm completion branch (update, not create).
      Verified: pages render, routes compile + enforce token/admin auth (401/307).
**Phase E — Admin mobile "New Lead"** ✅ (ships on next EAS rebuild)
- [x] `admin-app/app/lead/new.tsx` — New Lead screen (name/email/phone → Complete →
      /api/admin/leads/create via apiFetch); success state with share-link + channels.
- [x] Nav entry in More → Operations (mobile more.tsx).
      Verified: typecheck clean (only pre-existing expo-file-system errors remain).

**Phase F — Polish, test end-to-end, deploy** (remaining)
- [x] Migration APPLIED to live DB — 13/13 columns verified.
- [x] Live E2E test PASSED 20/20 (create → persist → quote → reserve → editable
      reserve → deposit claim), against the real DB, test data cleaned up. Confirmed
      move_date stores as an exact `date` (2026-08-15); DB is UTC; app reads correct
      YYYY-MM-DD via PostgREST. See lessons #13/#14.
- [x] Bank env vars → Vercel production (4 vars) + prod redeploy. Verified the
      details are inlined in the live quote page's JS chunk.
- [x] Base moving prices CONFIRMED (owner locked 2-bed/3-bed/+£50; studio £400/£450 &
      1-bed £450/£500 kept as £50 step-downs). Already matched the live engine — no change.
- [ ] Confirm EOT cleaning extrapolation (studio £100/1-bed £150/4-bed £300/5+ £350;
      2-bed £200 & 3-bed £250 already given).
- [x] `lead_details_request` WhatsApp template — drafted (WHATSAPP_TEMPLATES.md),
      added to the SID map (env `WHATSAPP_LEAD_DETAILS_SID`), and wired into the invite
      (free-text fallback until Meta approves + the SID is set).
- [x] EAS iOS production build TRIGGERED (build #9, com.ampleremovals.admin) — running
      on EAS. Next: `eas submit --platform ios` to push to TestFlight once it's READY.
      https://expo.dev/accounts/ccmendel/projects/ample-admin-app/builds/3d5a1e61-b397-4b56-98c0-1feed3b83afe

### Owner to-do (external, can't be scripted)
- Submit `lead_details_request` to Meta via Twilio; set WHATSAPP_LEAD_DETAILS_SID in Vercel.
- Confirm EOT cleaning bands (studio £100 / 1-bed £150 / 4-bed £300 / 5+ £350).

Note: DATABASE_URL (with DB password) now in .env.local (gitignored) for future
migrations — run `npx ts-node scripts/run-migrations.ts` or add statements there.

### Review
(fill in as phases land)

---

# Task: Fix BST move-date off-by-one (website booking)
### Plan
- [x] Add `toISODate` (local YYYY-MM-DD) helper to `lib/utils.ts`
- [x] Serialise date fields to plain strings at the submit boundary (`useBookingForm`)
- [x] Harden server `createBooking.toDateString` to resolve in UK tz (`ukDateString`)
- [x] Verify old-vs-new across BST/GMT/DST-boundary dates (all correct)
- [x] Log the lesson (lessons.md #13)

### Review
Website bookings for summer dates were stored one day early. Root cause was a
`Date` crossing to the server and being serialised as UTC. Fix keeps the form
working with Date objects but sends plain local `YYYY-MM-DD`, so the day the
customer picked is preserved. Admin edit path was already correct. NOTE: historical
bookings can't be auto-corrected — the original intended date was never recorded
separately (customers saw the shifted date too). Offered a read-only audit of
upcoming BST-range bookings as a follow-up.

---

# Driver + Admin App Programme

Big batch from the owner. Built in stages; driver-app + admin-app changes ship on EAS rebuilds.
Decisions locked: porter = role badge + same job (no Start Journey/GPS for porters); extras &
expenses = **admin approves first**; multi-day = mostly same-day but **undelivered jobs roll over**.

## Stage 1 — Server-side (testable now, no rebuild)
- [ ] 1A. Undelivered-overflow: a job past its date that isn't delivered stays in the driver's
      "today" until marked done. Exclude completed. (jobs API `today` scope)
- [ ] 1B. Admin "undelivered / overdue" endpoint: assigned jobs past their date, not yet delivered.
- [ ] 1C. `role` (driver|porter) on booking_driver_assignments; jobs API returns it.
- [ ] 1D. AnyVan jobs: schema + add endpoint (name, amount, phone, date/time, email optional) +
      48h-after rating SMS (warm, names the driver + Ample Removals, NOT pretending to be AnyVan)
      → internal rating → 5★ → Google review.
- [ ] 1E. Extras & expenses: schema (pending → admin approves) + driver submit endpoints.
- [ ] 1F. Availability & leave: schema + request endpoint.

## Stage 2 — Driver app (EAS rebuild)
- [ ] Role badge per job (+ hide Start Journey/GPS for porters).
- [ ] 7-day **calendar** view: tap a day → that day's jobs.
- [ ] Job **history**: pick a day or a date range → completed jobs.
- [ ] **Payslip** access (list + view).
- [ ] **Performance dashboard** (jobs done, on-time %, acceptance rate, tips, rating trend).
- [ ] **Crew view + task split** (drivers + porters on the job).
- [ ] **Expenses** with receipt photos (submit → pending).
- [ ] **Extras / additional charges** on site (submit → pending).
- [ ] **Availability & leave** requests.

## Stage 3 — Admin app (EAS rebuild)
- [ ] Create Quote / Deposit Invoice / Full Invoice screens — **100% parity with web**.
- [ ] **AnyVan Jobs** add screen.
- [ ] **Undelivered / overdue** deliveries view.
- [ ] Approve extras / expenses; set driver vs porter role on assignment.

## Review
(fill in as stages land)
