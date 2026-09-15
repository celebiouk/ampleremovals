## Task: Confirmation-page personalisation + admin Standard/Premium quote toggle

### Plan
- [x] `lib/business-hours.ts` — warmer copy ("dedicated move coordinator"), new `phoneNote` field.
- [x] `app/(public)/confirmation/page.tsx` — removed "Make Another Booking", added the phone-number callout, single "Call us now" action, warmer heading/body.
- [x] `lib/notifications.ts` — email/SMS/WhatsApp updated to match (heading, phone note, "coordinator" language throughout).
- [x] `supabase/migrations/add_show_premium_quote.sql` — `bookings.show_premium_quote BOOLEAN DEFAULT TRUE`.
- [x] `lib/bookings/quoteDelivery.ts` — `sendReserveMessages` takes a `showPremium` flag; single-quote email/SMS/WhatsApp branch when off (no Standard/Premium framing at all).
- [x] `app/api/quote/details/route.ts` + the customer quote reveal page — expose/respect `showPremiumQuote`; Premium block, its button, and the "Choose your package" label all disappear when off.
- [x] `app/api/admin/bookings/[id]/quote/tiers/route.ts` (new) — admin sets Standard + Premium totals and the toggle, optionally sends immediately (save vs "Save & Send", mirroring the existing itemized quote builder's pattern).
- [x] `components/admin/quotes/EditRemovalsQuoteModal.tsx` (new) — Removals-specific "Edit Quote" UI (tiered model), separate from the itemized `QuoteBuilderModal` used by every other service.
- [x] `app/(admin)/admin/bookings/[id]/page.tsx` — "Edit Quote"/"Build Quote" now opens the new modal for Removals bookings, unchanged for everything else.
- [x] `types/index.ts` — added `quote_premium_total`/`show_premium_quote` to the `Booking` type.
- [x] Typecheck (only pre-existing baseline noise); confirmed the new column defaults `true` for all 241 existing bookings (no behaviour change for anyone until admin actually uses the toggle).

### Review
Two independent changes bundled together (both requested in the same message):

**Confirmation page** now reads as a real assignment, not a form receipt: "Your dedicated move
coordinator is on it!", a phone-number callout ("We'll be calling from 0333 577 2070 — do save it!"),
and a single "Call us now" action instead of the old "Make Another Booking" button, which never made
sense right after a genuine submission. Same language reused in the email/SMS/WhatsApp via the shared
`lib/business-hours.ts` helper from the previous task.

**Admin quote toggle**: Removals bookings now have their own "Edit Quote" modal (Standard + Premium
price fields, a "Show Premium" toggle) distinct from the itemized line-item builder every other service
uses — the two pricing models were never the same thing, so keeping them as separate components avoided
awkwardly overloading one UI for two different data shapes. Toggling Premium off removes ALL trace of
tiering everywhere the customer could see it: the quote reveal page (Premium card, its button, the
"Choose your package" label), and the quote email/SMS/WhatsApp (single price, "Confirm my quote" instead
of "I'm booking Standard/Premium"). "Save & Send" reuses the exact same `markQuoteSent`/`sendReserveMessages`
pipeline the rest of the quote system already relies on, so the quote-follow-up drip and everything else
downstream keeps working unchanged.

**Watch out for:** the itemized `QuoteBuilderModal` (used for Man & Van/House Clearance/etc.) was
intentionally left untouched — those services never had a Standard/Premium reveal page to begin with,
so the toggle has no meaning for them.
