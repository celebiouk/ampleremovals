## Task: Structured on-the-day extra charges (items / stairs / distance) with auto-pricing and auto-send on approval

### Context / decisions already made with the user
- Driver picks a reason (extra item / extra stairs / extra distance / other),
  not a free-text box. Item picker reuses the existing customer-facing catalog
  (`lib/inventory-catalog.ts`) — same list, same keys.
- Price auto-calculates from admin-set rates, but the driver can manually
  override the number before submitting.
- Admin still approves every extra (nothing auto-charges without a human
  looking at it first).
- On approval: send the customer a message via email + SMS automatically,
  and queue a WhatsApp message (existing `whatsapp_queue` infra — admin sends
  it manually from their own WhatsApp, one tap via the wa.me link). This
  matches the existing `sendWhatsApp()` behaviour already in `lib/twilio.ts`,
  no change needed there.

### What exists today (confirmed by reading the code, not assumed)
- `JobExtraButton.tsx` → free-text description + amount → `job_extras` row
  (status: pending) → admin Approvals page → approve/reject.
- **Approving currently does nothing else** — no invoice, no customer
  message. That's the gap this task closes.
- `invoices` table already has `line_items` (jsonb) + `total`; `invoice_type`
  enum currently only has `deposit` / `full_balance`.

### Plan
**A. Rates — admin-editable, not hardcoded**
- [ ] Migration: `settings` gets `extra_item_rate` (default 15),
      `extra_stairs_rate_per_flight` (default 10), `extra_distance_free_meters`
      (default 20), `extra_distance_rate_per_10m` (default 5).
- [ ] Small "Extra charge rates" section added to the admin Settings page so
      these £ amounts are editable without touching code.

**B. Structured `job_extras` + new invoice type**
- [ ] Migration: `job_extras` gets `extra_type` (item|stairs|distance|other),
      `item_key`, `quantity`, `flights`, `distance_meters`, `auto_amount`
      (server-computed, kept even if driver overrides `amount`), `invoice_id`.
- [ ] Migration: `ALTER TYPE invoice_type ADD VALUE 'extra'`.

**C. Driver app — structured entry**
- [ ] New `GET /api/drivers/extra-rates` — returns the 4 settings values.
- [ ] Rewrite `JobExtraButton.tsx`: pick type (Item/Stairs/Distance/Other) →
      type-specific inputs (item picker from `INVENTORY_CATALOG` + qty;
      flights number; distance in metres) → shows auto-calculated price,
      editable → submit.
- [ ] `POST /api/drivers/jobs/[bookingId]/charges`: accepts the structured
      fields, computes `auto_amount` server-side (authoritative, for the
      record) from current settings rates, stores both `auto_amount` and the
      driver's final `amount`, builds a human-readable `description` from the
      structured fields.

**D. Approval → invoice + send**
- [ ] New `lib/bookings/extraCharge.ts`: `createAndSendExtraCharge()` —
      generates invoice number + pay code, inserts an `invoices` row
      (`type: 'extra'`, one line item, `status: 'sent'`), generates the PDF
      (best-effort, same pattern as the existing generate route), links
      `job_extras.invoice_id`, then sends email (full breakdown + pay link) +
      SMS (short version + pay link) + WhatsApp (queued, no code change) to
      the customer, and logs activity.
- [ ] `PATCH /api/admin/job-extras`: on `status: 'approved'`, call the above;
      on `'rejected'`, unchanged (just marks it, no customer contact).
- [ ] Approvals page: show the structured breakdown (type, qty/flights/
      distance, auto vs. final amount) instead of just the raw description.

### Verification
- [ ] Typecheck main repo (baseline: 136 pre-existing errors, excluding
      driver-app) and driver-app separately — confirm unchanged.
- [ ] Scripted DB test: create a test booking + job_extras row for each of the
      4 extra types, approve it, confirm an `invoices` row + `whatsapp_queue`
      row + `activity_log` entry are created with the right numbers, then
      clean up.
- [ ] Commit + push; deploy the Next.js/admin side via `vercel --prod --yes`.
      **Driver-app UI changes need the user's own `eas build`/submit to reach
      phones** — that's a real exception to "never ask the user to do it
      manually," since it needs their own Apple/Google developer credentials
      and can't be scripted from here.

### Review
What was done:
- `settings` gained 4 admin-editable rate columns (item/stairs/distance) with
  a new "On-the-day extra charge rates" section on the Settings > Company tab.
- `job_extras` gained structured columns (`extra_type`, `item_key`, `quantity`,
  `flights`, `distance_meters`, `auto_amount`, `invoice_id`) and `invoice_type`
  gained a new `'extra'` value — both applied directly to the live DB and
  verified via `information_schema`.
- Driver app's "Add extra charge" is now a 2-step picker (reason → details)
  instead of free text: Item reuses the booking catalog (flattened into
  `driver-app/lib/extra-catalog.ts` — Metro is scoped to this project only,
  can't share the main repo's file), Stairs/Distance take a number, Other
  keeps the old free-text fallback. Price auto-calculates from the rates but
  is always editable before submitting.
- `POST /api/drivers/jobs/[bookingId]/charges` computes `auto_amount`
  server-side from the live settings rates (never trusts the client's math)
  and stores it alongside the driver's final `amount`.
- The real gap this closes: approving an extra used to do nothing. Now
  `lib/bookings/extraCharge.ts` generates its own small invoice (type
  `'extra'`, own pay code + PDF) and sends the customer email + SMS
  immediately, with WhatsApp queued via the existing `whatsapp_queue` (no
  code change needed there — `sendWhatsApp()` already queues, never auto-sends).
- Verified end-to-end against the live DB with a real booking before
  shipping: pricing calc for all 3 structured types, invoice line items/total,
  WhatsApp queue row, activity log, `job_extras.invoice_id` linkage — all
  correct, then cleaned up the test rows.
- Typecheck clean on both the main repo (136 pre-existing errors, unchanged)
  and driver-app (0 errors).

Known gap, not addressed: driver-app UI changes need the user's own
`eas build`/submit to actually reach phones — that's scripted-deploy's one
real exception, since it needs their own Apple/Google developer credentials.
The Next.js/admin side is deployed; the native app is not yet rebuilt.
