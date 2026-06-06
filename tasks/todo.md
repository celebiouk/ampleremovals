## Task: Phase 4 — Admin Dashboard & Full CRM Pipeline

### Context
Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅ | Phase 4 ✅ (THIS)

### Plan
- [x] Write this plan to tasks/todo.md
- [x] lib/constants.ts — STATUS_LABELS, STATUS_COLOURS, SERVICE_LABELS, SERVICE_COLOURS
- [x] Fix login page — generic error message
- [x] components/admin/StatusBadge.tsx
- [x] components/admin/ServiceBadge.tsx
- [x] components/admin/StatCard.tsx
- [x] components/admin/ConfirmDialog.tsx
- [x] components/admin/AdminSkeleton.tsx
- [x] hooks/useBookingDetail.ts
- [x] hooks/useBookingsList.ts
- [x] app/api/admin/bookings/[id]/status/route.ts
- [x] app/api/admin/bookings/bulk-status/route.ts
- [x] app/api/admin/send-email/route.ts
- [x] app/api/admin/send-sms/route.ts
- [x] app/(admin)/admin/page.tsx — live stats + tabs + bookings table
- [x] app/(admin)/admin/bookings/page.tsx — full list with filters, pagination, bulk
- [x] app/(admin)/admin/bookings/[id]/page.tsx — full CRM booking detail
- [x] app/(admin)/admin/customers/page.tsx
- [x] app/(admin)/admin/customers/[id]/page.tsx
- [x] app/(admin)/admin/reports/page.tsx — 4 Recharts charts
- [x] tsc --noEmit clean
- [x] tasks/lessons.md updated
- [x] Git commit + push

### Review
Phase 4 fully complete. Every admin page is live with real data.
Key decisions:
- Client-side Supabase fetching (anon key + auth session) for all reads
- API routes (service role) for all mutations (status, notes, email, SMS)
- Promise.allSettled for parallel notification firing
- Set spread replaced with Array.from() to satisfy TS target
