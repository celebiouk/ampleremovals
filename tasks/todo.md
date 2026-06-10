## PHASE 11 — Driver Portal, Accounts, Earnings & Assignment System

**Started:** 2026-06-09  
**Status:** IN PROGRESS → SPLIT INTO 4 SUB-PHASES

---

### CONTEXT

Phases 1-10 complete. Full booking wizard, admin CRM, invoicing, and 30+ automation touchpoints are live.

Phase 11 = Complete driver management system with:
- Driver authentication & dark-themed portal
- Job assignments & real-time status updates
- Automatic earnings calculation
- Admin driver management interface
- Customer notifications on driver updates

**⚠️ This phase is MASSIVE — split into 4 sub-phases for manageable implementation:**

---

## 🔷 PHASE 11A — Database, Types & Authentication Foundation

**Goal:** Set up database schema, TypeScript types, and driver authentication system

### Checklist

**Database:**
- [x] Create Phase 11 plan in tasks/todo.md
- [x] Create supabase/migrations/add_drivers.sql with:
  - [x] ENUMs: driver_status, job_status_update, earnings_status
  - [x] drivers table with RLS policies
  - [x] booking_driver_assignments table
  - [x] driver_job_status_updates table
  - [x] driver_earnings table
  - [x] driver_tips table
  - [x] Update bookings table (latest_driver_status column)
  - [x] All indexes and RLS policies
  - [x] Realtime enabled

**TypeScript & Constants:**
- [x] Add driver types to types/index.ts
  - [x] Driver interface
  - [x] BookingDriverAssignment interface
  - [x] DriverJobStatusUpdate interface
  - [x] DriverEarnings interface
  - [x] DriverTip interface
- [x] Add constants to lib/constants.ts
  - [x] DRIVER_STATUS_LABELS
  - [x] DRIVER_STATUS_COLORS
  - [x] JOB_STATUS_LABELS
  - [x] JOB_STATUS_COLORS
  - [x] EARNINGS_STATUS_LABELS

**Authentication & Routing:**
- [x] Create lib/user-type.ts
  - [x] getUserType(userId) function
  - [x] Returns 'admin' | 'driver' | 'unknown'
- [x] Update middleware.ts
  - [x] Protect /drivers/* routes (require driver session)
  - [x] Protect /admin/* routes (require admin session)
  - [x] Redirect drivers trying to access /admin
  - [x] Redirect admins trying to access /drivers

**Testing & Commit:**
- [x] Run SQL migration in Supabase
- [x] Test build (npm run build)
- [x] Commit Phase 11A to Git
- [x] Push to GitHub

### Phase 11D — Post-audit gaps (2026-06-10)
- [x] Driver assignment notification — assign-driver had `TODO: notify driver`;
      drivers were never told about a new job (had to check the portal).
      Now sends Email + SMS + WhatsApp (best-effort) with date, service, route,
      reference + portal link.
- [x] Verified customer status notifications already fire all 3 channels
      (Email + SMS + WhatsApp) — no gap.
- [x] Earnings calculation: now fires on Stripe AND manual mark-paid, excludes
      VAT (net base). (See earnings commits.)
- [ ] DEFERRED: day-before job reminder to drivers (customer day-before reminder
      exists; driver variant not wired into the cron).

### Phase 11C — Post-audit gaps (2026-06-10)
- [x] CRITICAL (security): all Phase 11 admin API routes were UNAUTHENTICATED
      (used service role with no session check; middleware doesn't guard /api/*).
      Anyone could list driver PII, create drivers, approve/pay earnings, assign
      drivers, record tips. Added lib/admin-auth.ts requireAdmin() guard to:
      drivers (GET/POST), drivers/[id] (GET/PATCH), drivers/[id]/documents (GET/POST),
      earnings (GET), earnings/[id]/approve, earnings/[id]/pay,
      bookings/[id]/assign-driver, bookings/[id]/drivers (GET/DELETE),
      bookings/[id]/tips. Also secured legacy admin/driver-status (was an open
      email/SMS/WhatsApp spam vector).
- [x] CRITICAL (correctness): driver earnings never calculated. assign-driver
      inserts a £0 driver_earnings placeholder; the Stripe webhook did
      `if (existingEarnings) continue`, so it skipped the real calculation on
      payment and drivers stayed at £0. Webhook now UPDATEs the placeholder and
      only skips when booking_total > 0 (true idempotency); preserves tips.
- [ ] DEFERRED (incomplete, not broken): create-driver form omits address /
      hire_date / driver_notes; admin can't upload docs at create time (only after).

### Phase 11B — Post-audit gaps (2026-06-10)
- [x] CRITICAL: RLS hardening — drivers could read ALL customers/bookings/
      invoices/other drivers' earnings via the over-broad `TO authenticated
      USING(true)` policies. New migration add_driver_rls_hardening.sql:
  - [x] is_driver_user() / current_driver_id() SECURITY DEFINER helpers
  - [x] Broad admin policies on customer-data + driver tables now exclude drivers
  - [x] Driver-scoped SELECT policies on bookings/customers/addresses
  - [ ] ⚠️ MUST be run in Supabase (touches RLS) — see migration file
- [x] Fixed broken "Today's Jobs" nav — /drivers/jobs/today now resolves
      (was falling through to /jobs/[bookingId] with id="today")
- [x] Dashboard "Upcoming Jobs" now shows real assignments (was hardcoded placeholder)
- [x] Job detail: co-drivers ("Working With") + per-job earnings card
      (co-drivers served via RLS-safe /api/drivers/jobs/[id]/extras)
- [x] Refactored jobs list into reusable components/drivers/DriverJobsList
- [ ] DEFERRED (low value): earnings monthly chart, editable address on driver profile,
      dedicated GET driver API routes (RLS now enforces scoping for client reads)

### Phase 11A — Post-audit gaps (2026-06-10) — ALL CLOSED
- [x] activity_log: accurate `performed_by` on all Phase 11 logs (was defaulting to 'system')
- [x] Driver document/photo storage:
  - [x] driver-documents private bucket migration + RLS (add_driver_documents_bucket.sql)
  - [x] lib/storage.ts helpers (upload/signed-URL/delete + DRIVER_DOC_COLUMN map)
  - [x] Driver-facing photo upload (POST /api/drivers/profile/photo + profile UI)
  - [x] Admin doc upload (POST/GET /api/admin/drivers/[id]/documents + DriverDocuments component)
- [x] /drivers/reset-password recovery flow (request page + update page + login link + middleware/layout bypass)
- [x] Wire up dead fields:
  - [x] emergency_contact_relationship (driver profile, registration form, admin display)
  - [x] is_lead_driver (assign modal toggle → API → "Lead" badge in AssignedDrivers)

---

## 🔷 PHASE 11B — Driver Portal (Driver-Facing Interface)

**Goal:** Build complete driver portal with dark theme, job management, and status updates

### Checklist

**Authentication Pages:**
- [ ] Create app/(drivers)/drivers/login/page.tsx
  - [ ] Dark theme (#0f172a background)
  - [ ] Email + password login
  - [ ] Check getUserType() after login
  - [ ] Redirect to /drivers/dashboard
- [ ] Create app/(drivers)/drivers/reset-password/page.tsx
- [ ] Create app/(drivers)/drivers/layout.tsx
  - [ ] Dark sidebar (#0f172a)
  - [ ] Navigation: Dashboard, Jobs, Today, Earnings, Profile, Documents
  - [ ] Driver name + avatar
  - [ ] Sign out button

**Dashboard:**
- [ ] Create app/(drivers)/drivers/dashboard/page.tsx
  - [ ] Today's jobs banner (purple gradient if jobs, grey if none)
  - [ ] 4 KPI cards: Jobs This Week, Jobs This Month, Earnings This Month, Tips This Month
  - [ ] Upcoming jobs list (next 7 days)
  - [ ] Recent activity feed
  - [ ] Earnings mini chart (last 6 weeks)

**Jobs Pages:**
- [ ] Create app/(drivers)/drivers/jobs/page.tsx
  - [ ] Filter tabs: All | Upcoming | Today | Past
  - [ ] Job cards with date, service, customer, addresses, status
  - [ ] Purple left border for today's jobs
  - [ ] Green border for completed jobs
- [ ] Create app/(drivers)/drivers/jobs/[bookingId]/page.tsx ⭐ **CRITICAL**
  - [ ] Job summary card (purple gradient header)
  - [ ] Pick up address with "Get Directions" button
  - [ ] Drop off address with "Get Directions" button
  - [ ] Job details (property type, services, description)
  - [ ] 5 STATUS UPDATE BUTTONS (large, prominent):
    - [ ] On My Way (purple)
    - [ ] 20 Minutes Away (blue)
    - [ ] 10 Minutes Away (amber)
    - [ ] 15 Mins to Delivery (orange)
    - [ ] Job Completed (green) with confirmation dialog
  - [ ] Current status display
  - [ ] Optional note textarea
  - [ ] My earnings for this job (expandable)
  - [ ] Co-drivers section (if multiple drivers)

**Other Pages:**
- [ ] Create app/(drivers)/drivers/earnings/page.tsx
  - [ ] Summary cards: Total, Pending, Approved, Paid, Tips
  - [ ] Earnings table with filters
  - [ ] Monthly earnings chart
- [ ] Create app/(drivers)/drivers/profile/page.tsx
  - [ ] Profile photo upload
  - [ ] Editable fields: preferred name, phone, emergency contact, address
  - [ ] Read-only fields: name, email, pay %, status
  - [ ] Save buttons per section
- [ ] Create app/(drivers)/drivers/documents/page.tsx
  - [ ] View profile photo
  - [ ] View driving licence (front/back)
  - [ ] Licence expiry warnings (red if expired, amber if <90 days)

**API Routes:**
- [ ] GET /api/drivers/profile
- [ ] PATCH /api/drivers/profile
- [ ] GET /api/drivers/jobs (with filters)
- [ ] GET /api/drivers/jobs/[bookingId]
- [ ] POST /api/drivers/jobs/[bookingId]/status ⭐ **MOST CRITICAL**
  - [ ] Verify driver is assigned to booking
  - [ ] Insert driver_job_status_updates record
  - [ ] Update booking.latest_driver_status
  - [ ] Send customer notifications (Email + SMS + WhatsApp)
  - [ ] Send admin notification
  - [ ] If job_completed: trigger completion automation
- [ ] GET /api/drivers/earnings
- [ ] POST /api/drivers/profile/photo (upload to Storage)

**Testing & Commit:**
- [ ] Test driver login flow
- [ ] Test driver can view jobs
- [ ] Test driver status updates
- [ ] Test customer receives notifications
- [ ] Test build (npm run build)
- [ ] Commit Phase 11B to Git
- [ ] Push to GitHub

---

## 🔷 PHASE 11C — Admin Driver Management Interface

**Goal:** Build admin-side driver CRUD, assignments, and earnings management

### Checklist

**Admin Pages:**
- [ ] Create app/(admin)/admin/drivers/page.tsx
  - [ ] Summary cards: Total Drivers, Active, Inactive, Jobs This Week
  - [ ] Drivers table: Photo, Name, Phone, Email, Status, Pay %, Jobs, Earnings Owed, Actions
  - [ ] Search & filter
  - [ ] "Add New Driver" button
- [ ] Create app/(admin)/admin/drivers/new/page.tsx
  - [ ] Personal details form
  - [ ] Address section
  - [ ] Employment section (status, hire date, pay %, notes)
  - [ ] Driving licence fields
  - [ ] Document uploads (profile photo, licence front/back)
  - [ ] Create Supabase Auth account
  - [ ] Generate temporary password
  - [ ] Send welcome email to driver
- [ ] Create app/(admin)/admin/drivers/[id]/page.tsx
  - [ ] Driver header card (photo, name, status, contact)
  - [ ] Personal details card
  - [ ] Documents card (view/upload/replace)
  - [ ] Employment & pay card (inline editable)
  - [ ] Current assignments card
  - [ ] Earnings summary card
  - [ ] Activity log
  - [ ] "Assign to Job" button
- [ ] Create app/(admin)/admin/drivers/[id]/edit/page.tsx
  - [ ] Same form as create but pre-filled
  - [ ] Update Auth email if changed
- [ ] Create app/(admin)/admin/drivers/[id]/earnings/page.tsx
  - [ ] Summary cards
  - [ ] Earnings table with actions
  - [ ] [Approve] [Mark Paid] [Dispute] buttons
  - [ ] Add tip functionality (per row)
  - [ ] Bulk actions
  - [ ] Export CSV
- [ ] Create app/(admin)/admin/drivers/earnings/page.tsx
  - [ ] All drivers earnings overview
  - [ ] Summary cards: Total Paid, Pending, Approved, Tips
  - [ ] Per-driver table
  - [ ] Date range filter

**Components:**
- [ ] Create components/admin/drivers/AssignDriverModal.tsx
  - [ ] Works from booking detail page (select driver)
  - [ ] Works from driver profile page (select booking)
  - [ ] Pay percentage override field
  - [ ] Lead driver toggle
  - [ ] Assignment notes
  - [ ] On assign: create assignment, calculate earnings placeholder, send driver notification
- [ ] Update app/(admin)/admin/bookings/[id]/page.tsx
  - [ ] Add "Assigned Drivers" section in right panel
  - [ ] Show driver cards with photo, name, status, pay %
  - [ ] "Assign Driver" button
  - [ ] Remove driver action (with confirmation)

**Admin API Routes:**
- [ ] GET /api/admin/drivers (list with filters)
- [ ] POST /api/admin/drivers (create + Auth account + welcome email)
- [ ] GET /api/admin/drivers/[id]
- [ ] PATCH /api/admin/drivers/[id] (update + Auth email if changed)
- [ ] POST /api/admin/drivers/[id]/documents (upload to Storage)
- [ ] GET /api/admin/drivers/[id]/earnings
- [ ] PATCH /api/admin/drivers/[id]/earnings/[earningId] (approve/paid/dispute)
- [ ] POST /api/admin/drivers/[id]/earnings/[earningId]/tip
- [ ] POST /api/admin/bookings/[bookingId]/assign-driver
- [ ] DELETE /api/admin/bookings/[bookingId]/drivers/[driverId]

**Navigation:**
- [ ] Update admin sidebar
  - [ ] Add "Drivers" to Operations group (Truck icon)

**Storage:**
- [ ] Document Supabase Storage setup
  - [ ] Bucket: driver-documents (private)
  - [ ] Structure: drivers/[driverId]/profile.jpg, licence-front.jpg, licence-back.jpg
- [ ] Update lib/storage.ts
  - [ ] uploadDriverDocument(driverId, docType, file)
  - [ ] getDriverDocumentSignedURL(driverId, docType)

**Testing & Commit:**
- [ ] Test admin creates driver account
- [ ] Test driver receives welcome email
- [ ] Test admin assigns driver to booking
- [ ] Test driver sees assignment in portal
- [ ] Test earnings approval workflow
- [ ] Test build (npm run build)
- [ ] Commit Phase 11C to Git
- [ ] Push to GitHub

---

## 🔷 PHASE 11D — Earnings Automation & Final Integration

**Goal:** Auto-calculate earnings on payment, integrate with existing systems, polish

### Checklist

**Earnings Automation:**
- [ ] Create lib/driver-earnings.ts
  - [ ] calculateDriverEarnings(bookingId, bookingTotal) function
  - [ ] Fetch all booking_driver_assignments for booking
  - [ ] For each driver:
    - [ ] Get pay_percentage (override or default)
    - [ ] Calculate gross_earnings = bookingTotal × (pay_percentage / 100)
    - [ ] Fetch tips from driver_tips
    - [ ] Calculate total_earnings = gross + tips
    - [ ] Insert/update driver_earnings record (status: pending)
  - [ ] Log to activity_log
- [ ] Update app/api/webhooks/stripe/route.ts
  - [ ] On payment_intent.succeeded: call calculateDriverEarnings()
- [ ] Update app/api/admin/invoices/[id]/mark-paid/route.ts
  - [ ] After marking paid: call calculateDriverEarnings()

**Notifications:**
- [ ] Create driver notification templates
  - [ ] Driver assignment email (job details + portal link)
  - [ ] Driver assignment SMS
  - [ ] Job reminder email (day before)
  - [ ] Job reminder SMS (day before)
- [ ] Create customer status update templates (5 variants)
  - [ ] on_my_way: "Driver is on their way" email + SMS + WhatsApp
  - [ ] twenty_mins_away: "Driver is 20 mins away" email + SMS + WhatsApp
  - [ ] ten_mins_away: "Driver is 10 mins away" email + SMS + WhatsApp
  - [ ] fifteen_mins_to_delivery: "15 mins to delivery" email + SMS + WhatsApp
  - [ ] job_completed: "Move complete" email + SMS + WhatsApp
- [ ] Update existing day-before cron to send driver reminders

**Integration with Existing Systems:**
- [ ] Link driver tips from Phase 8 to driver_earnings
  - [ ] When tip is paid via Stripe, record in driver_tips
  - [ ] Associate tip with driver_id (from assignment)
  - [ ] Update driver_earnings.tip_amount
- [ ] Update job completion flow
  - [ ] When driver marks job_completed: trigger existing Phase 8 automation
  - [ ] Send tip link + review request to customer
  - [ ] Calculate final driver earnings

**Polish & Testing:**
- [ ] Mobile responsive audit (driver portal)
- [ ] Dark theme consistency check
- [ ] All loading states present
- [ ] All error states handled
- [ ] All empty states designed
- [ ] Test: Complete driver journey (login → view job → update status → customer notified)
- [ ] Test: Complete admin journey (create driver → assign → approve earnings → mark paid)
- [ ] Test: Complete earnings flow (invoice paid → auto-calculate → admin approve → mark paid)
- [ ] Test build (npm run build)
- [ ] Commit Phase 11D to Git
- [ ] Push to GitHub
- [ ] Deploy to Vercel

---

## 📊 PHASE 11 COMPLETION SUMMARY

**When ALL 4 sub-phases are complete:**

- [ ] Review Phase 11 in tasks/lessons.md
- [ ] Document key learnings
- [ ] Test entire driver system end-to-end
- [ ] Git commit: "feat: Phase 11 complete — Driver Management System"
- [ ] Git push to main
- [ ] Deploy to production

---

### REVIEW (To be filled after Phase 11D)

**What was done:**  
(To be filled)

**What worked:**  
(To be filled)

**What to watch out for:**  
(To be filled)
