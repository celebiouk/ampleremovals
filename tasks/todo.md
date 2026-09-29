## Task: No more "confirm your quote" — go straight to "pay your deposit", 20% for new bookings, all messaging updated
### Context / decisions already made with the user
- Tier choice stays (Standard/Premium side by side) — each card's button becomes
  "Pay £Y deposit to secure your date" (deposit amount, not full price).
  Clicking reserves that tier and goes straight into the payment method screen
  (card/Klarna/bank) — no separate confirmation screen in between.
- Scope: ALL 5 services, not just Removals. Man & Van / House Clearance /
  House Cleaning / End of Tenancy currently use a completely different, older
  flow (QuoteBuilderModal → "Confirm This Quote" click → admin manually emails
  a deposit invoice later, no self-serve payment at all). That flow is being
  retired in favour of the same infrastructure Removals already has
  (`/quote/[bookingId]/[token]`, self-serve card/Klarna/bank payment) — the
  underlying `bookings` columns (quote_total, quote_line_items, deposit_amount,
  quote_crew_*) are already shared/generic across all 5 services, so this is
  mostly wiring, not new infrastructure.
- New deposit % = 20, but ONLY for bookings created from now on. Existing
  bookings must keep computing at whatever percentage they were quoted at
  (25%) — requires storing the percentage ON the booking at creation, not a
  single global config read live everywhere.

### Plan
**A. Deposit percentage — per-booking, not global**
- [ ] Migration: `bookings.deposit_percentage NUMERIC NOT NULL DEFAULT 25`
      (backfills all existing rows to 25 automatically).
- [ ] `lib/deposit.ts`: `depositFor(total, percentage?)` — accepts an override.
- [ ] `.env.local` + `.env.example`: `NEXT_PUBLIC_DEPOSIT_PERCENTAGE` 25 → 20.
- [ ] `lib/quote-engine.ts`: replace the separate hardcoded `DEPOSIT_RATE = 0.25`
      with the same `lib/deposit.ts` constant (two sources of truth for the same
      number is exactly what caused the last bug).
- [ ] `lib/bookings/createBooking.ts` + `lib/bookings/completeLead.ts`: stamp
      `deposit_percentage: DEPOSIT_PERCENTAGE` on the booking at creation time
      (best-effort column, same pattern as `deposit_amount`).
- [ ] `app/api/quote/reserve/route.ts`, `app/api/quote/details/route.ts`: select
      `deposit_percentage` and pass it through `depositFor()` instead of relying
      on the global constant, so old bookings keep their original rate.
- [ ] `/quote/[bookingId]/[token]/page.tsx`: display `quote.depositPercentage`
      (from the API) instead of the imported global constant.
- [ ] Sync the new env var to Vercel production (not just local) — via CLI, not
      asking the user to click through the dashboard.

**B. Remove the "confirm" step everywhere — CTA is "pay deposit"**
- [ ] `/quote/[bookingId]/[token]/page.tsx` `RevealView`: button copy →
      "Pay £Y deposit to secure your date" (deposit amount) per tier, headline/
      subtext reworked away from "choose your package / tailor it below"
      confirm-framing.
- [ ] `lib/bookings/quoteDelivery.ts` `sendReserveMessages` (email+SMS+WhatsApp
      sent the moment a quote goes out): reword CTA + surrounding copy the same
      way, both the showPremium and single-quote variants.
- [ ] `app/api/quote/reserve/route.ts`: eagerly create the deposit invoice row
      (`getOrCreateBookingInvoice`) at reserve time instead of waiting for the
      customer to click "pay by card" — closes a real gap where the deposit
      follow-up ladder currently finds no invoice yet and silently sends nothing.

**C. Unify all 5 services onto the one real payment flow**
- [ ] `app/api/quote/details/route.ts`: prefer stored `quote_crew_men` /
      `quote_van_count` (what QuoteBuilderModal actually sets for non-Removals
      quotes) over the Removals tier-based crew calculator when present.
- [ ] Rewrite `app/api/admin/bookings/[id]/quote/send/route.ts` (used by
      QuoteBuilderModal for the other 4 services) to stop building its own
      separate PDF/email/"confirm" flow, and instead call the same
      `markQuoteSent` + `sendReserveMessages` used by Removals, with
      `showPremium: false`. One delivery path for all 5 services.
- [ ] Leave `/confirm-quote/...` + `/api/quote-confirm*` routes in place
      (don't delete) for any quote already sent with an old-style link, but
      nothing new will ever generate a link to them again.

**D. Follow-up messaging (email/SMS/WhatsApp) — pay-deposit focused, not pushy**
- [ ] `lib/followups/engine.ts` `quoteVars()`: fix `actionLink` from the dead
      `/confirm-quote/${id}/${token}` to the real `/quote/${id}/${token}` page —
      a functional fix needed regardless of copy (every reminder currently
      links to a dead-end page).
- [ ] `lib/followups/content.ts` `QUOTE_FOLLOWUP_DAYS` (14 days × email/sms/
      whatsapp): reword from "confirm/decide" framing to "pay your deposit to
      secure your date," keeping each day's underlying angle (reassurance,
      no-hidden-fees, reviews, gentle scarcity, etc.) — just the CTA and framing
      change, not the whole sequence.
- [ ] `DEPOSIT_FOLLOWUP_DAYS` already matches the ask closely — light pass only
      for consistency, not a rewrite.
- [ ] `lib/bookings/quoteDelivery.ts` `sendDepositMessages`: light copy pass for
      tone consistency with the new CTA style.

### Review
What was done:
- Deposit % is now stamped per-booking at creation (`bookings.deposit_percentage`,
  migrated with DEFAULT 25 so every existing booking keeps its original rate).
  New bookings pick up the current site-wide rate — now 20% — at the moment
  they're created/completed. `depositFor()` takes an optional override so every
  read site can pass the booking's own rate instead of a live global constant.
  Fixed a second, independent hardcoded 25% in `lib/quote-engine.ts` that would
  have drifted from the real rate otherwise (Lesson 18).
- The customer quote page no longer has a "choose your package, then confirm"
  step — each tier's button now reads "Pay £Y deposit to secure your date"
  (the deposit, not the full price) and goes straight into the payment method
  screen on click. Same reframing applied to the "quote sent" email/SMS/WhatsApp.
- `/api/quote/reserve` now creates the deposit invoice immediately on reserve
  (instead of only when the customer later clicks "pay by card"), which also
  fixes a real gap where the deposit follow-up reminder ladder found no
  invoice to chase until a payment attempt had already happened.
- Unified all 5 services onto one delivery path: the generic Quote Builder
  (Man & Van / House Clearance / House Cleaning / End of Tenancy) now sends
  through the same `markQuoteSent` + `sendReserveMessages` Removals uses,
  landing the customer on the same working self-serve payment page
  (`/quote/[bookingId]/[token]`) instead of the old "click to confirm, then
  wait for an admin to manually email a deposit invoice" flow — which had no
  self-serve payment at all. The legacy `/confirm-quote` + `/api/quote-confirm*`
  routes are left in place (not deleted) so any quote already sent with an
  old-style link still resolves, but nothing will ever generate a new link to
  them again.
- Fixed every follow-up reminder (14-day quote sequence, all 5 services) —
  they were linking to the dead `/confirm-quote/...` route regardless of
  service type; now point to the real, working `/quote/[bookingId]/[token]`.
  Reworded the quote-sequence copy from "confirm/decide" framing to "pay your
  deposit to secure your date," keeping each day's original angle
  (reassurance, no-hidden-fees, reviews, gentle scarcity, etc.) — the deposit
  follow-up sequence already matched the ask closely and needed no rewrite.
- Synced `NEXT_PUBLIC_DEPOSIT_PERCENTAGE=20` to Vercel production via the CLI
  (not asked to be done manually).

Known gap, not addressed: the generic Quote Builder's "Require Deposit" toggle
(`quote_deposit_required`) isn't wired into the new flow — if an admin
switches it off for a Man & Van/House Clearance/etc. booking, the customer
still gets the standard "pay deposit" quote page rather than a no-deposit
variant. This toggle wasn't part of the original ask and handling it properly
needs its own branch in the reserve/details/page logic — flagging it rather
than quietly leaving it half-working.
