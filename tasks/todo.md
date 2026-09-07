## Task: Meta-ad landing page /booking + Klarna/card/bank payment options

Decisions (confirmed): flow = contact → FROM postcode → TO postcode → bedrooms → items → date → editable quote.
Card & bank = 25% deposit; Klarna = FULL move ÷3. Klarna already enabled in Stripe.

### Phase 1 — the landing page + editable-quote wizard  (this build)
- [ ] `app/(landing)/layout.tsx` — no navbar/footer; keep Pixels + AttributionCapture (Meta pixel + ad attribution).
- [ ] `app/(landing)/booking/page.tsx` — renders the wizard; distraction-free.
- [ ] `components/landing/LandingBooking.tsx` — compelling, minimal wizard:
      contact (name/phone/email) → FROM postcode → TO postcode → bedrooms → key items → date
      → editable quote step (Standard with "what you get" INSIDE it; Premium = "everything in Standard, plus…"; Back to edit → price updates).
      Assumes a domestic house move (no domestic/business choice). Postcode-only (no address lookup).
- [ ] `app/api/quote/estimate/route.ts` — public live quote (standard + premium + deposit) from bedrooms/items/postcodes.
- [ ] `app/api/booking/landing/route.ts` — create customer + booking (postcode-only addresses) + quote + token; send "everything you supplied" email; return {bookingId, token} → go to /quote/[id]/[token] to reserve + pay.
- [ ] Strong ad copy throughout.

### Phase 2 — payment options on the quote/pay screen  (next build)
- [ ] Quote/pay screen: single Pay → 3 options: Pay by card (deposit), Pay in 3 with Klarna (full), Pay by bank transfer (deposit).
- [ ] Stripe Checkout: card (deposit) + klarna (full ÷3); reuse invoice + webhook.
- [ ] Confirmation/deposit emails reflect all 3 payment options.

### Review
(to be filled in on completion)
