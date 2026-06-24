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
