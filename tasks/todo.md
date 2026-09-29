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
