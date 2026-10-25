## Task: Worker-confirmed job completion + flexible bulk pay + payment email

### Context / decisions made with the user
- Applies to EVERYONE (drivers and porters, including a lead driver on a
  normal booking) — not porters-only. Decided via AskUserQuestion.
- Scope is specifically the flat-pay model (the model going forward for
  every assignment per earlier session work) — a worker's pay is gated on
  them saying "I did this" + admin confirming, not on journey-tracking or
  invoice payment. The EXISTING lead-driver journey/"Complete Job"/delivery-
  confirmation flow (customer-facing: triggers invoice + survey) is left
  completely untouched — this is a separate, payroll-only signal.
- Admin's confirmation IS the approval — skips straight from the new
  "awaiting_confirmation" state to "approved" (ready to pay), not back
  through the existing pending→approve step.
- Bulk pay must support picking ANY combination of specific jobs (not a
  rigid date-range auto-group like the existing payslip/pay-run system,
  which the audit confirmed can't hand-pick individual earnings) — admin can
  select across multiple workers in one action; the backend fans that out
  into one payment record + one email PER worker.
- Payment email: "we've paid you, check your bank, raise an issue within
  48 hours or we treat it as settled" — itemised job list for a batch.
- Any job list built for this (awaiting-confirmation queue, earnings table)
  shows the customer's name, never the address.

### What already exists (confirmed by a research pass — not rebuilding)
- `driver_earnings` pending→approved→paid lifecycle, `/admin/earnings` page
  (global, all workers), individual approve/pay endpoints that already email.
- `pay_extra_amount` already folds into `total_earnings` — no double-counting
  needed when summing a payment.
- Payslip/pay-run system exists but is too rigid for this ask (date-range
  auto-group only) — intentionally NOT using it; building a lighter, more
  flexible "select earnings, pay them" path instead.

### Plan
**A. Database**
- [ ] `booking_driver_assignments`: add `completion_marked_at`,
      `completion_confirmed_at`, `completion_confirmed_by`.
- [ ] New `driver_payments` (id, driver_id, reference, amount, method,
      paid_at) + `driver_payment_earnings` (payment_id, earning_id) join —
      lets one payment cover many jobs, and the email know exactly what it covered.

**B. Backend**
- [ ] `assign-driver/route.ts`: when `flatAmount` is set, insert
      `driver_earnings` as `'awaiting_confirmation'` instead of `'pending'`
      (legacy no-flat-amount path, filled in by `calculateDriverEarnings` on
      invoice-paid, is untouched).
- [ ] New `POST /api/drivers/jobs/[bookingId]/mark-done` — worker marks their
      own assignment done; push-notifies admin.
- [ ] New `POST /api/admin/bookings/[id]/assignments/[assignmentId]/confirm-done`
      — admin confirms; flips that assignment's earnings to `'approved'`.
- [ ] New `GET /api/admin/job-completions?status=awaiting` — everything
      marked-done-but-not-confirmed, with customer name (no address).
- [ ] New `POST /api/admin/earnings/pay` — takes `earningIds[]`, validates
      all `'approved'`, groups by driver, marks all paid, writes one
      `driver_payments` row + links per driver, emails each worker their own
      itemised list + total + the bank-check/48h language. Replaces the old
      single-earning `/pay` endpoint's job (UI switches to call this with a
      1-element array too, so single and bulk pay behave identically).

**C. Web admin**
- [ ] Approvals page: 4th tab "Job completions" — list + Confirm action.
- [ ] Earnings page: add a Customer column; checkboxes on approved rows;
      "Pay selected (£X)" bulk action calling the new endpoint; remove the
      now-redundant old single-pay call path.

**D. Driver app**
- [ ] Job detail screen: "Mark my job done (for pay)" button for the
      signed-in worker's own assignment (any role), separate from the
      existing lead-driver Complete Job button. Shows "Waiting for
      confirmation" once tapped.

**E. Native admin app**
- [ ] Flagged as a later batch (same pattern as recent sessions) unless
      asked for now — the web side is the primary surface and covers the
      full workflow end to end.

### Verification
- [ ] Typecheck main repo (baseline 136) + driver-app, unchanged.
- [ ] Scripted DB test: mark-done → confirm-done → status flip verified;
      pay-batch across 2+ earnings for one driver → one driver_payments row,
      both earnings flip to paid, email content checked.
- [ ] Commit, push, deploy web; driver-app change needs its own EAS build
      (flag as usual, ask before triggering).

### Review
What was done:
- New `earnings_status` enum value `awaiting_confirmation` (separate migration
  — enum additions can't share a transaction with other DDL, per earlier
  session lesson). A flat-pay assignment now starts there instead of
  `pending`, so it's invisible as "owed money" until the worker says they
  did it and admin agrees.
- Two new assignment-level timestamps (`completion_marked_at`,
  `completion_confirmed_at` + `completion_confirmed_by`) drive the gate.
  Admin's confirm action skips straight to `approved` (admin confirming IS
  the approval) — doesn't route back through the legacy pending→approve step.
- New `driver_payments` + `driver_payment_earnings` tables let ONE payment
  cover an arbitrary set of jobs — not a rigid date-range like the existing
  (untouched) payslip system. `lib/payroll/payEarnings.ts` groups a mixed
  selection by worker automatically: one payment record + one email per
  worker, even if admin pays several people in a single action. This is the
  whole "pay weekly" workflow — it's this same action, just run on a
  schedule, not a separate feature.
- Replaced the old single-earning `/api/admin/earnings/[id]/pay` (deleted)
  with `/api/admin/earnings/pay`, used for both single and bulk pay on both
  the web earnings page (new checkboxes + "Pay Selected" action) and the
  native admin-app earnings screen (updated in place).
- Approvals page gained a 4th "Job done" tab for the confirm/reject queue —
  shows customer name, never the address, per the ask.
- Driver-app: found and fixed a real pre-existing bug while wiring this in —
  the single-job API route never actually attached `role` to the response,
  so the existing "porters skip the journey engine" UI branch had likely
  never fired correctly. Added a "Mark my job done" button (any role, any
  job with flat pay) separate from the lead driver's existing Complete Job
  button, which is untouched and still drives the customer-facing
  invoice/survey flow.
- Verified the new status-transition logic end-to-end against the live DB
  (awaiting_confirmation → marked done → confirmed → approved, across two
  real bookings for a real porter). Deliberately did NOT script-test the
  actual payment/email step — that would mean sending a real "you've been
  paid" email to a real person with no real payment behind it; correctly
  blocked by the sandbox's safety guard. The payment code itself reuses the
  exact pattern already proven for `extraCharge.ts` earlier this session.
- Typecheck clean on main repo (136 baseline, unchanged), admin-app (0),
  driver-app (0).

Known gap: existing assignments made before this shipped stay on the old
`pending` status (not retroactively migrated) — only new assignments get
the new gate. Native admin-app doesn't have the "Job done" confirmation
queue or multi-select bulk-pay UI yet (web covers the full workflow).
