# CLEANERS + AMPLECLEANERS.COM — MASTER PLAN
**Author:** Senior Engineer / Designer / Product Owner pass
**Created:** 2026-06-11 · **Status:** PLAN (awaiting approval to build)
**Owner:** CCMendel

> This document is the single source of truth for adding a **Cleaning** vertical
> to the Ample platform: a cleaners workforce, a new public booking site
> (amplecleaners.com), and unified management from the existing admin (web +
> mobile). Nothing here is built yet — this is the blueprint.

---

## 0. TL;DR (what we are building)

1. **Cleaners workforce** — cleaning workers, modelled exactly on the existing
   **Drivers** system. They self-register at `ampleremovals.com/cleaners/register`,
   log in at `ampleremovals.com/cleaners/login`, and get their own portal
   (jobs, earnings, profile). Admin can also create cleaner accounts.
2. **amplecleaners.com** — a NEW public website (separate Git repo, separate
   Vercel project) that looks and feels like ampleremovals.com but sells
   **cleaning** instead of removals. It writes into the **same Supabase
   database**, using cleaning-specific tables.
3. **Unified admin** — the existing admin **web** dashboard and **mobile** app
   manage BOTH removals and cleaning bookings, plus Drivers and Cleaners, from
   one place (one login, one Supabase project).
4. **Navigation changes** — add **Cleaners** to admin menus (web + mobile);
   on mobile, make **Cleaners** a bottom tab in the middle (where Pipeline is
   now) and move **Pipeline** into the More menu.

---

## 1. Terminology (avoid confusion)

| Term | Meaning | Analogous to |
|---|---|---|
| **Cleaner** | A cleaning **worker/employee** (workforce). Registers/logs in, has a portal, gets assigned jobs, earns a pay %. | **Driver** |
| **Cleaning customer** | An **end customer** who books a cleaning service on amplecleaners.com. | Removals customer |
| **Cleaning booking** | A booking for a cleaning job. | Removals booking |
| **amplecleaners.com** | The public **customer-facing** site to book cleaning. | ampleremovals.com |
| **Admin** | Internal staff managing everything (both verticals). | (unchanged) |

**One-line model:** `Cleaners : Cleaning :: Drivers : Removals`. We are cloning
the Drivers pattern for the workforce, and the public-site + bookings pattern
for the customer side — into one shared database, surfaced in one admin.

---

## 2. Guiding principles

- **Reuse, don't reinvent.** The Drivers subsystem, the booking pipeline,
  invoices, payments, messaging (email/SMS/WhatsApp), activity log, and the
  admin shell already exist. Cleaning rides on the same rails.
- **One database, one admin.** All three public surfaces (removals site,
  cleaners portal, cleaning site) and both admins point at the SAME Supabase
  project. The admin is vertical-aware via a single discriminator column.
- **Minimal blast radius.** Cleaning is **additive**. No existing removals flow
  changes behaviour. Every new query is filtered by `vertical`.
- **Senior-grade hygiene.** RLS on every new table, Zod on every new route,
  errors to `server_logs`, push to Git per phase, no hardcoded secrets.

---

## 3. The big architecture decision — how cleaning bookings are stored

We need cleaning bookings to (a) have their own cleaning-specific fields, yet
(b) appear next to removals in ONE admin dashboard with minimal new code.

### Recommended: shared `bookings` table + a `vertical` discriminator
- Add `vertical TEXT NOT NULL DEFAULT 'removals'` (`'removals' | 'cleaning'`)
  and `source_site TEXT` (`'ampleremovals' | 'amplecleaners'`) to `bookings`.
- Cleaning-specific fields live in a **satellite table** `cleaning_details`
  (1:1 with `bookings`), so the core booking row stays clean.
- The admin already reads `bookings`; it instantly sees both verticals. We add
  a vertical **filter** (All / Removals / Cleaning) and a vertical badge.
- Status pipeline, invoices, payments, customers, addresses, activity_log,
  status_history, notifications are **all reused as-is**.

**Why this wins:** the admin "manage everything from one dashboard" requirement
is satisfied almost for free. Reporting, search, calendar, and the mobile app
keep working with a one-column change + a filter.

### Alternative (NOT recommended): separate `cleaning_bookings` table
- Fully separate table + a `UNION` view for admin. Honours "its own tables"
  literally, but **doubles** the admin code (two list screens, two detail
  screens, two pipelines, two of everything on web AND mobile). High cost,
  little benefit. We keep cleaning's "own tables" via the satellite +
  workforce tables instead.

> **DECISION NEEDED (owner):** confirm the shared-table + discriminator approach.
> The rest of this plan assumes it. (Cleaning still gets its "own tables":
> `cleaning_details`, `cleaners`, `booking_cleaner_assignments`, and a cleaning
> service/pricing catalog.)

---

## 4. Database schema (new + changed)

All in the existing Supabase project. New migrations under `supabase/migrations/`.

### 4.1 Changes to existing tables
```sql
-- bookings: vertical discriminator (default keeps every existing row 'removals')
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vertical TEXT NOT NULL DEFAULT 'removals';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source_site TEXT;          -- 'ampleremovals' | 'amplecleaners'
CREATE INDEX IF NOT EXISTS idx_bookings_vertical ON bookings(vertical);

-- (optional) extend service_type to richer cleaning services, OR keep cleaning
-- service detail in cleaning_details.cleaning_type to avoid touching the enum.
```

### 4.2 `cleaners` (workforce — mirror of `drivers`)
Same shape as `drivers` (auth_user_id, names, DOB, contact, emergency contact,
address, hire_date, notes, **default_pay_percentage**, profile_photo_url, ID/
right-to-work doc URLs, `created_by`, timestamps). Plus cleaning-specific:
`skills TEXT[]` (e.g. end-of-tenancy, carpet, commercial), `has_own_supplies BOOLEAN`,
`dbs_checked BOOLEAN`, `dbs_expiry DATE`.

### 4.3 `booking_cleaner_assignments` (mirror of `booking_driver_assignments`)
`booking_id → bookings`, `cleaner_id → cleaners`, `pay_percentage_override`,
`is_lead_cleaner`, timestamps. Cleaner earnings reuse the same net-of-VAT calc.

### 4.4 `cleaning_details` (1:1 with cleaning bookings)
```sql
CREATE TABLE cleaning_details (
  booking_id UUID PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
  cleaning_type TEXT,        -- 'regular' | 'deep' | 'end_of_tenancy' | 'commercial' | 'after_builders'
  frequency TEXT,            -- 'one_off' | 'weekly' | 'fortnightly' | 'monthly'
  bedrooms INT, bathrooms INT, reception_rooms INT,
  property_type TEXT,        -- 'flat' | 'house' | 'office' | ...
  has_pets BOOLEAN,
  extras TEXT[],             -- ['oven','interior_windows','carpets','fridge',...]
  estimated_hours NUMERIC(4,1),
  access_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 `cleaning_service_catalog` (pricing/config, admin-editable)
Service definitions + base prices/hourly rates + extra add-on prices. Drives
the amplecleaners.com quote/estimate and the admin's quote builder for cleaning.

### 4.6 Reused as-is (no new tables)
`customers`, `addresses`, `invoices`, `payments`, `status_history`,
`activity_log`, `notifications`, `settings`, `admin_users`, `admin_push_tokens`.

### 4.7 RLS (every new table)
- `cleaners`: a cleaner can read/update only their own row (`auth_user_id = auth.uid()`);
  admins (service role) full access; anon can INSERT during self-registration
  (mirroring drivers). Harden with the existing `is_driver_user()` pattern →
  add `is_cleaner_user()` and exclude cleaners from broad authenticated policies.
- `booking_cleaner_assignments`: cleaner sees only rows for their own
  `cleaner_id`; admin full.
- `cleaning_details`: public (anon) INSERT during booking; admin full; cleaner
  reads only for bookings they're assigned to.

---

## 5. Auth & roles

Same Supabase `auth.users` across all surfaces. Extend the role resolver:

- `lib/user-type.ts` → `UserType = "admin" | "driver" | "cleaner" | "unknown"`.
  Check `cleaners` table after `drivers`; if found → `"cleaner"`.
- Middleware: protect `/cleaners/(portal)` routes for cleaners; keep `/admin/*`
  admin-only; ensure a cleaner can't reach admin and vice-versa.
- **Admin-bearer fix already in place** (`createClient()` reads the bearer token)
  — the mobile admin app continues to work for cleaning endpoints too.

---

## 6. SURFACE 1 — Cleaners workforce portal (on ampleremovals.com)

Clone the Drivers portal. New routes on the EXISTING removals repo:

**Public (self-serve):**
- `app/(public)/cleaners/register/page.tsx` — registration form (mirrors
  `drivers/register`): personal details, contact, skills, supplies, consent.
- `app/(public)/cleaners/login/page.tsx` (or reuse a shared login) — login.
- `app/(public)/cleaners/reset-password/...` — password reset.

**Portal (auth'd cleaner):**
- `app/(cleaners)/cleaners/dashboard/page.tsx` — today/this week's jobs.
- `app/(cleaners)/cleaners/jobs/page.tsx`, `jobs/[bookingId]/page.tsx` — job
  detail, status updates ("on my way / arrived / completed"), add extras.
- `app/(cleaners)/cleaners/earnings/page.tsx` — earnings (net-of-VAT, manual
  payout, same model as drivers).
- `app/(cleaners)/cleaners/profile/page.tsx` + `documents/page.tsx`.
- `app/(cleaners)/cleaners/layout.tsx` — portal shell.

**API (cleaners):** mirror `app/api/drivers/*` → `app/api/cleaners/*`
(register, check-user-type, jobs/[id]/status, jobs/[id]/extras, profile/photo).

**Admin API (manage cleaners):** mirror `app/api/admin/drivers/*` →
`app/api/admin/cleaners/*` (list, [id], documents) plus
`app/api/admin/bookings/[id]/assign-cleaner` and `.../cleaners` and a
`cleaner-status` push endpoint (notifies the customer).

> Effort: ~mechanical clone of Drivers with renamed identifiers + the extra
> cleaning fields. Highest-confidence part of the project.

---

## 7. SURFACE 2 — amplecleaners.com (new repo + new Vercel project)

A public site to book cleaning, visually a sibling of ampleremovals.com.

### 7.1 Repo & infra
- **New Git repo** `amplecleaners` (separate from this one).
- **New Vercel project** linked to that repo, domain `amplecleaners.com`.
- **Same env**: same `NEXT_PUBLIC_SUPABASE_URL` / anon key / service role as
  removals (shared DB). Same Resend/Twilio/Stripe accounts (or sub-config).
- `source_site = 'amplecleaners'`, `vertical = 'cleaning'` on everything it
  creates.

### 7.2 How to build it fast (shared code strategy)
- **Phase A (recommended start): fork & rebrand.** Copy the ampleremovals.com
  public layer (homepage, booking wizard, shared UI, lib/supabase, postcode,
  resend/twilio/stripe, brand system) into the new repo; strip admin/driver
  code; swap copy + imagery from removals → cleaning; repoint booking submit to
  write `vertical='cleaning'` + `cleaning_details`. Fastest path to a live site
  that "looks similar."
- **Phase B (later, optional): extract a shared package.** Move the common UI/
  lib into a private `@ample/ui` + `@ample/db` package (or a Turborepo monorepo
  containing removals-site, cleaners-site, admin-web). Removes drift. Do this
  only once both sites are stable.

### 7.3 Pages (mirror removals, cleaning content)
- Homepage (hero, services: Regular/Deep/End-of-Tenancy/Commercial/After-Builders),
  testimonials, areas covered, FAQ.
- Booking wizard per cleaning service → collects `cleaning_details` (bedrooms/
  bathrooms/frequency/extras), customer + address, date/time.
- Confirmation page. Quote/estimate from `cleaning_service_catalog`.
- Booking submit API → inserts `customers` (or finds), `addresses`, `bookings`
  (`vertical='cleaning'`, `source_site='amplecleaners'`), `cleaning_details`,
  then fires the SAME new-booking alert (email/SMS/WhatsApp/push to admin).

### 7.4 Brand
- Same structure, fonts (Bricolage Grotesque + Plus Jakarta Sans), spacing,
  component system. Keep purple as the family brand OR introduce a cleaning
  accent (e.g. teal/green) — **owner decision**. Default: keep purple primary,
  use a fresh cleaning hero + photography so it reads as "cleaning."

---

## 8. SURFACE 3 — Unified admin (web + mobile)

The admin manages both verticals. Mostly additive filtering + the Cleaners
workforce screens.

### 8.1 Web admin (this repo)
- **Bookings / Pipeline / Calendar / Reports**: add a **vertical filter**
  (All / Removals / Cleaning) and a small **vertical badge** on rows. All read
  the shared `bookings` table — minimal change.
- **Booking detail**: when `vertical='cleaning'`, show a **Cleaning details**
  card (from `cleaning_details`) and an **Assigned cleaners** section + a
  **cleaner-status** push, mirroring the drivers UI.
- **Cleaners management**: new `app/(admin)/admin/cleaners/` (list + detail),
  cloned from `admin/drivers`, incl. "create cleaner account".
- **Nav**: add **Cleaners** to `components/admin/AdminShell.tsx` (next to
  Drivers). Add a top-level **vertical switcher** in the header (optional).

### 8.2 Mobile admin app
- **Bookings/Pipeline/Calendar/Reports**: same vertical filter + badge. The
  booking card already shows a service tile; add a tiny vertical chip.
- **Booking detail**: Cleaning details card + Assigned cleaners + cleaner-status
  push (clone of the driver components already built).
- **Cleaners screens**: `app/cleaners/index.tsx` (list, like drivers tab),
  `app/cleaner/[id].tsx`, `app/cleaner/new.tsx`, `cleaner/[id]/edit.tsx` —
  cloned from the drivers screens; reuse `apiFetch` + `/api/admin/cleaners/*`.
- **Cleaner earnings** screen (clone of driver earnings).

### 8.3 NAVIGATION CHANGES (explicit, per your instruction)

**Mobile bottom tab bar** — Pipeline moves out, Cleaners takes its place:
```
BEFORE:  Dashboard | Bookings | Pipeline | Drivers | More
AFTER:   Dashboard | Bookings | Cleaners | Drivers | More
```
- Add a `cleaners` tab screen; register it in `app/(tabs)/_layout.tsx`; add it
  to `components/shared/TabBar.tsx` ICONS/LABELS (icon: `Sparkles` or `SprayCan`).
- Remove `pipeline` from the tab bar; add **Pipeline** to the **More** menu
  (a sensible group, e.g. Operations or a new "Workflow" group) so it's still
  reachable.

**Mobile More menu** — add **Cleaners** in **Operations**, *before* Customers:
```
Operations:  Cleaners → /cleaners   (NEW, first)
             Customers → /customer
             Calendar  → /calendar
             Pipeline  → /pipeline   (NEW here, moved from the tab bar)
```
*(Cleaners appears both as a primary tab and in the menu — same pattern as
having a screen reachable two ways; confirm if you'd rather it be tab-only.)*

**Web admin nav** — add **Cleaners** alongside Drivers in `AdminShell`.

> **DECISION NEEDED (owner):** Cleaners as a **primary tab** AND in the More
> menu (current plan), or tab-only? And which More group should Pipeline land in?

---

## 9. Cross-cutting concerns

- **Notifications/messaging**: reuse Resend/Twilio templates; add cleaning
  variants (subject/body mention "cleaning"). New-booking admin alert + push
  already fan out — just include vertical in the title.
- **Invoices/quotes/payments**: reuse. Quote builder reads
  `cleaning_service_catalog` when `vertical='cleaning'`.
- **Earnings**: cleaner earnings = driver earnings model (net-of-VAT × pay%),
  manual payout, mark-paid in admin.
- **Reports**: add a vertical breakdown (removals vs cleaning revenue/bookings).
- **Offline + encrypted cache (mobile)**: already in place; new cleaning queries
  inherit it automatically.
- **Search/command palette**: include cleaning bookings + cleaners.

---

## 10. Phased delivery (milestones)

> Each phase ends with: tests/verification, Git push, and a short review note.

- **Phase 0 — Foundations (this repo).** Migrations: `vertical`/`source_site`
  on bookings, `cleaners`, `booking_cleaner_assignments`, `cleaning_details`,
  `cleaning_service_catalog`, RLS, `is_cleaner_user()`. Extend `getUserType`.
- **Phase 1 — Cleaners workforce portal (ampleremovals.com).** Register/login/
  reset + portal (dashboard/jobs/earnings/profile/documents) + cleaners APIs.
  Admin: cleaners management screens + nav (web).
- **Phase 2 — Admin becomes vertical-aware (web).** Vertical filter/badge on
  bookings/pipeline/calendar/reports; Cleaning details + Assigned cleaners +
  cleaner-status on booking detail.
- **Phase 3 — Mobile admin parity.** Cleaners tab (replace Pipeline), Pipeline
  → More, Cleaners in Operations; cleaning details + assigned cleaners +
  cleaner-status + cleaner earnings; vertical filter/badge.
- **Phase 4 — amplecleaners.com (new repo + Vercel).** Fork/rebrand public
  site; cleaning booking wizard → writes `vertical='cleaning'` + details;
  confirmation + admin alerts; DNS + Vercel + env.
- **Phase 5 — Polish & launch.** Cleaning service catalog/pricing admin UI,
  cleaning email/SMS/WhatsApp templates, reports vertical breakdown, end-to-end
  test (book on amplecleaners → appears in admin → assign cleaner → invoice →
  cleaner sees job → status push → complete → earnings).
- **Phase 6 (optional) — De-dupe.** Extract shared `@ample/ui` + `@ample/db`
  (Turborepo) to kill drift between the two public sites.

---

## 11. Environment, infra & secrets

- **Supabase**: one project, shared. Run new migrations (scripted; the owner
  only needs to apply them once in the Supabase SQL editor if not via CLI).
- **New Vercel project** for amplecleaners.com; set the SAME Supabase + Resend
  + Twilio + Stripe envs; set `NEXT_PUBLIC_SITE_URL=https://www.amplecleaners.com`.
- **DNS**: point amplecleaners.com at Vercel (A/CNAME) — owner/registrar action.
- **Stripe**: same account; webhooks must point to BOTH sites (or centralise
  payment handling in the removals/admin app and have cleaning reference it).
  **Decision:** centralise Stripe webhooks in one place to avoid double-handling.
- **Git**: new repo `amplecleaners`; this repo keeps cleaners-portal + admin.

---

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Two public repos drift apart | Phase 6 shared package; until then, a short "sync checklist" when shared UI changes. |
| RLS leak (cleaner sees others' data) | Reuse the hardened `is_driver_user()` pattern → `is_cleaner_user()`; test each policy with a cleaner token. |
| Migration breaks existing date/booking flows | `vertical` defaults to 'removals'; everything additive; verify removals regression after Phase 0. |
| Stripe webhook double-processing | Single source of truth for payment webhooks. |
| Admin UI clutter (two verticals) | Vertical filter + badge; default view = All; remember last filter. |
| Mobile tab change confuses muscle memory | Ship with a one-time "Pipeline moved to More" hint. |
| Cleaning customer accounts vs guest booking | Default to guest booking (like removals); optional accounts later. |

---

## 13. Open decisions for the owner (please confirm before Phase 0)

1. **Data model:** confirm shared `bookings` + `vertical` discriminator (vs
   fully separate `cleaning_bookings`). *(Recommended: shared.)*
2. **Nav:** Cleaners = primary mobile tab **and** in More-Operations (current
   plan), or tab-only? Which More group gets Pipeline?
3. **Brand for amplecleaners.com:** keep purple primary, or add a cleaning
   accent colour (e.g. teal)?
4. **Cleaning customers:** guest booking only (recommended) or full customer
   accounts/login from day one?
5. **Shared code:** start by forking the removals site (fast) — OK? Monorepo
   extraction later.
6. **Stripe:** centralise webhooks in the admin/removals app — OK?

---

## 14. What I can start immediately on approval
- Phase 0 migrations + `getUserType`/role plumbing (this repo) — low risk.
- The mobile nav reorg (Cleaners tab in the middle, Pipeline → More) once a
  Cleaners screen exists (built in Phase 3, or a stub first if you want the nav
  change visible sooner).
- Scaffolding the cleaners portal by cloning the drivers subsystem.

> **Recommended first move:** approve §13, then I do **Phase 0 + Phase 1**
> (foundations + cleaners workforce on ampleremovals.com) in this repo, verify,
> and push — before spinning up the separate amplecleaners.com repo in Phase 4.

---

### Appendix A — Files to clone (Drivers → Cleaners), this repo
```
app/(public)/drivers/register        → app/(public)/cleaners/register
app/(public)/drivers/reset-password  → app/(public)/cleaners/reset-password
app/(drivers)/drivers/*              → app/(cleaners)/cleaners/*
app/api/drivers/*                    → app/api/cleaners/*
app/api/admin/drivers/*              → app/api/admin/cleaners/*
app/api/admin/bookings/[id]/assign-driver  → .../assign-cleaner
app/api/admin/bookings/[id]/drivers        → .../cleaners
app/api/admin/driver-status                → .../cleaner-status
components/admin/drivers/*           → components/admin/cleaners/*
admin-app/app/(tabs)/drivers.tsx     → admin-app/app/(tabs)/cleaners.tsx
admin-app/app/driver/*               → admin-app/app/cleaner/*
admin-app/app/earnings (driver)      → cleaner earnings variant
supabase/migrations/add_drivers.sql  → add_cleaners.sql (+ cleaning_details, catalog)
```

### Appendix B — Definition of done (whole project)
A customer books a clean on **amplecleaners.com** → it appears in the **admin**
(web + mobile) tagged **Cleaning** → admin assigns a **cleaner** → generates a
**quote/invoice** → the **cleaner** sees the job in their portal, pushes status
updates (customer notified) → marks complete → **earnings** computed → admin
marks payout paid. All from **one Supabase DB** and **one admin**, with the
removals flows completely unaffected.
