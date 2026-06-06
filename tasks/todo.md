## Task: Phase 3 — Booking Submission API, Backend Logic & Notifications

### Context
Phase 1 ✅ — scaffold, schema, SDKs
Phase 2 ✅ — all 5 booking wizards, form submission to API routes
Phase 3 ✅ (THIS) — server-side API hardening, notifications, error logging

### Plan
- [x] Write this plan to tasks/todo.md
- [x] lib/supabase/server.ts — export createAdminClient() (alias for createServiceClient)
- [x] lib/utils.ts — add normaliseUKPhone()
- [x] lib/log-error.ts — logError() utility using createAdminClient
- [x] lib/bookings/createBooking.ts — return { reference, bookingId, customerId }
- [x] lib/notifications.ts — sendCustomerConfirmationEmail, sendAdminNewBookingEmail, sendCustomerConfirmationSMS
- [x] lib/bookings/handleBookingRoute.ts — call all 3 notifications after successful createBooking
- [x] scripts/test-postcode.ts
- [x] scripts/test-removals.ts
- [x] scripts/test-man-and-van.ts
- [x] scripts/test-house-clearance.ts
- [x] scripts/test-house-cleaning.ts
- [x] scripts/test-end-of-tenancy.ts
- [x] docs/api-collection.json — Postman collection
- [x] tsc --noEmit clean (scripts/ excluded from tsconfig)
- [x] tasks/lessons.md updated
- [x] Git commit + push

### Review
All Phase 3 deliverables complete.
- createBooking() now returns { reference, bookingId, customerId }
- All 3 notifications fire in parallel via Promise.allSettled — a notification
  failure never blocks the booking response
- Twilio silently skips when credentials are placeholders (null-safe)
- logError() writes to server_logs with console.error fallback
- tsc --noEmit passes clean (scripts/ dir excluded from compilation)
- Resend API key is live in .env.local — customer + admin emails will fire
- Twilio needs real credentials in .env.local + Vercel for SMS to send
