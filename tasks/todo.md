## Task: Fix stale quote price shown/charged to customer after admin edits it
### Plan
- [x] `app/api/quote/reserve/route.ts` — stop recomputing the Standard total from
      `quote_line_items` (stale). Trust `quote_total` (the admin-edited figure)
      as the source of truth so it's never overwritten with an old number.
- [x] `app/api/quote/details/route.ts` — the deposit shown before the customer
      reserves must always be 25% of the CURRENT `quote_total`, not the stale
      stored `deposit_amount` from booking creation. Only trust stored
      `deposit_amount` once the deposit has actually been invoiced/reserved.
- [x] `app/(public)/quote/[bookingId]/[token]/page.tsx` — `RevealView` currently
      recomputes the total/deposit shown to the customer by summing
      `quote.lines`, ignoring the server-computed (and admin-edited) `quote.total`.
      Switch it to use `quote.total`/`quote.deposit` directly (the line-removal
      feature this was for is already dead — `removed` is a permanently empty set).
- [x] `lib/bookings/booking-invoice.ts` — `getOrCreateBookingInvoice` reuses an
      existing unpaid invoice's frozen `total`, which can mask a later admin
      price edit even after the above fixes. Update the existing invoice's
      total/line_items to the fresh `net` when they differ, before reusing it.
- [x] Verify `lib/auto-full-invoice.ts` (final balance) needs no change — it
      already reads `quote_total` fresh at send time; it was only ever wrong
      because `quote_total` itself was getting corrupted upstream.
- [x] Typecheck / lint the touched files — clean (only pre-existing, unrelated
      warnings/errors elsewhere in the repo).
- [x] Commit and push.

### Review
Root cause: `quote_total` (set correctly by the admin's Edit Quote flow) was
never actually the value the customer paid against. Three places recomputed or
re-read a DIFFERENT, stale figure derived from `quote_line_items` /
`deposit_amount`, which the admin's edit route never touches:

1. The customer's quote-reveal page summed `quote.lines` client-side instead of
   using the server's `quote.total`.
2. `/api/quote/reserve` (fired when the customer clicks "I'm booking…") went
   further and recomputed the total from those same stale line items, then
   WROTE it back into `quote_total`/`deposit_amount` — permanently clobbering
   the admin's edited price in the database, not just on screen.
3. Stripe checkout and the final-balance invoice both read `quote_total`
   straight from the bookings table, so by then they inherited the already
   corrupted figure.

Fix: `quote_total` is now the single source of truth end-to-end — the reveal
page displays it directly, reserve no longer recomputes/overwrites it from
line items, and `deposit_amount` is only trusted once a deposit has actually
been invoiced (before that, it's always freshly derived from `quote_total`).
Also hardened `getOrCreateBookingInvoice` to resync an existing unpaid
invoice's total with the current price rather than trusting a frozen figure,
in case a customer had an invoice created before an admin's edit and returns
to pay later.

Not addressed (flagged for a separate pass, not touched here since it's data
cleanup, not code): any bookings that already had their `quote_total`
corrupted by the old reserve-route bug before this fix shipped. Those would
need a manual/scripted reconciliation against what the admin actually intended
to charge — happy to write that repair script on request, but it needs your
judgment on which affected bookings to correct and to what figure.

## Task: Find + fix bookings affected by the stale-quote bug (follow-up)
### Plan
- [x] `scripts/find-stale-quote-bookings.ts` — read-only scan of `activity_log`
      for "admin edited the quote" → "customer reserved with a different total"
      pairs, cross-referenced against current `bookings`/`invoices` state.
- [x] Reviewed the 3 matches individually before touching anything:
      - RMV-2026-7BT22 (Raghav) — admin caught and manually corrected it live;
        fully paid at the correct £1400. No action needed.
      - RMV-2026-RVVN5 (Antony) — job completed, customer genuinely paid
        £730.20 against a £700 quote (£30.20 overcharge) because the bug
        corrupted the total used for the auto full-balance invoice.
      - RMV-2026-24CBF (Dr-Ali) — admin caught and re-corrected the quote to
        £300 with a correct £75 deposit invoice (unpaid) — but the DB's
        `deposit_amount` field still held the stale £134.50, which would have
        shown the wrong figure if the customer reopened the link before paying.
- [x] Asked before touching the overcharge (real money already moved) —
      confirmed: records-only fix, no Stripe refund for now.
- [x] `scripts/fix-stale-quote-bookings.ts` — applied:
      - RVVN5: `quote_total`/`quote_subtotal` corrected £730.20 → £700.00,
        `deposit_amount` set to £175 for record consistency. Historical
        `invoices` rows left untouched (they're the true record of what was
        actually charged/collected). Logged the £30.20 overcharge + "not
        refunded" to `activity_log` for your team to action.
      - 24CBF: `deposit_amount` corrected £134.50 → £75.00 to match the
        already-sent invoice. No money involved.
      - 7BT22: no change.
- [x] Verified with the read-only scan re-run — both corrected bookings now
      show consistent figures.

### Review
Outstanding: **RMV-2026-RVVN5 (Antony Hiscock) is owed a £30.20 refund** —
he paid £730.20 total against a £700 quote, and no refund has been issued.
The records now correctly show £700 as the intended price and the £30.20
discrepancy is logged on the booking's activity log, but the actual refund
(Stripe, or however you'd rather settle it) is still your call to make.
