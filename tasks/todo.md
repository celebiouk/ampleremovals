## Task: Remove customer-facing quote price, show "assigned to a team member" instead

### Plan
- [x] `lib/business-hours.ts` — new shared helper: `isWithinBusinessHours()` + `getAssignmentMessage()` (8am-6pm, Europe/London, derived from `lib/company.ts`'s `OPENING_HOURS_SPEC`).
- [x] `lib/bookings/createBooking.ts` — stop auto-calling `markQuoteSent` for a fresh Removals submission (quote_total still computed/stored for admin; status stays "inquiry").
- [x] `lib/bookings/completeLead.ts` — new `isAdminFlow` option; only admin's "fill it for them" (real price, real quote) still calls `markQuoteSent`. A customer completing their own partial lead does not.
- [x] `app/api/admin/leads/complete/route.ts` — pass `isAdminFlow: true`.
- [x] `hooks/useBookingForm.ts` — only admin completion still redirects to the priced `/quote/[id]/[token]` page; every customer-facing path (fresh submission, non-admin completion) goes to `/confirmation`.
- [x] `components/landing/LandingBooking.tsx` — same redirect change + copy tweaks ("fixed price" → "no obligation, quick call back", "See my quote" → "Submit request").
- [x] `app/(public)/confirmation/page.tsx` — renders the new time-based assignment message (computed server-side).
- [x] `lib/notifications.ts` — email/SMS copy updated to the assignment message; added `sendCustomerConfirmationWhatsApp` (queued, matching the "message = email+sms+whatsapp" rule).
- [x] `app/api/booking/notify/route.ts` — removals no longer gets the priced `sendReserveMessages` email; every service type uses the same no-price email+SMS+WhatsApp now.
- [x] `app/api/leads/complete/route.ts` — was sending the customer an immediate priced email (would have double-sent with the confirmation page's delayed trigger too) — removed; admin alert still fires immediately.
- [x] `app/api/booking/landing/route.ts` — same fallback fixed (rare `!quoteToken` path) + removed now-unused `quoteTotal`.
- [x] Typecheck (only pre-existing baseline noise remains, none in touched files); verified the 8am/6pm boundary logic against real BST/GMT dates with a scripted test (all 7 cases correct).

### Review
Customers never see a price anywhere in the initial enquiry flow anymore — all 5 services plus the ad
landing page now show/send "you've been assigned to a member of our team" with a time-aware promise
(within 30 minutes if it's currently 8am-6pm UK time, otherwise today-if-there's-time-or-8am-tomorrow),
computed once in `lib/business-hours.ts` and reused everywhere (confirmation page, email, SMS, WhatsApp).
No real "assign to a specific person" mechanism was built, per instruction — this is honest, generic
copy; the existing lead-routing admin alert is what actually prompts a human to act.

Admin's "fill it for them" flow is fully untouched: ReviewStep.tsx still shows the suggested Standard/
Premium prices in-wizard, and `completeLead`'s new `isAdminFlow` flag ensures that path alone still
sends the customer a real priced quote and advances the booking to "Quote Sent" — exactly as before.

Found and fixed two real bugs while tracing this through: `app/api/leads/complete/route.ts` was sending
the customer an immediate priced quote email that would have started DOUBLE-SENDING once the
confirmation page's existing 60-second delayed-notify trigger also fired for the same booking — removed
the immediate send. `app/api/booking/landing/route.ts` had a same-shaped (rarer) fallback, fixed the
same way. Server-side quote calculation (`quote_total`/`quote_line_items`) is untouched everywhere —
admin, lead-routing alerts, and invoicing still see it; only the CUSTOMER-facing display/messages changed.

**Watch out for:** `app/(public)/quote/[bookingId]/[token]/page.tsx` (the old priced reveal page) is now
only reachable via admin's "fill it for them" redirect and old bookmarked links — deliberately left
untouched rather than deleted, since it's still load-bearing for that one path. The landing page's
`<title>` metadata ("Get Your Instant Removals Quote") still references instant pricing for SEO/ad
targeting — left alone since changing ad-facing copy wasn't asked for and could affect campaign
matching; flagging it as an easy follow-up if wanted.
