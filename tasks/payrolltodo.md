# PAYROLL — IMPLEMENTATION PLAN (step-by-step)
**Author:** Senior engineer / designer / product owner pass
**Created:** 2026-06-13 · **Status:** PLAN (awaiting approval to build)
**Source brief:** `tasks/payrollprompt1.md` (the design + quality bar this must meet)
**Related:** `tasks/cleanerstodo.md` (cleaners workforce — payroll must cover them too)

> Payroll turns the per-job **earnings** we already calculate into proper
> **pay runs → payslips → payouts**, on both the web admin and the mobile admin,
> built to the world-class standard in `payrollprompt1.md`.

---

## 0. TL;DR

We already calculate, per booking, what each driver earns (`driver_earnings`:
net-of-VAT × pay% + tips, status `pending | approved | paid`). Payroll adds the
layer on top:

1. **Pay runs** — group a worker's earnings for a **period** (weekly/monthly).
2. **Payslips** — one per worker per run: gross + tips + adjustments = net pay.
3. **Payouts** — mark a payslip (or a whole run) **paid** (manual bank transfer),
   which flips the underlying earnings to `paid`.
4. **Documents/export** — payslip **PDF** per worker + **CSV** bank-transfer
   export for the whole run.
5. **Worker-facing payslips** — drivers (and later cleaners) see their payslips
   in their portal.

All to the existing design system (already built), worker-type-agnostic so it
covers **drivers now and cleaners later** with no rework.

---

## 1. IMPORTANT — read the brief, but note what already exists

`payrollprompt1.md` says "build the design system first." **That work is already
done** in this codebase — do **not** rebuild it. Reuse it:

- `admin-app/lib/colors.ts`, `lib/typography.ts`, `lib/tokens.ts`,
  `hooks/useTheme.ts`, and the component library (Button, Card, Badge, Avatar,
  ScreenHeader, Skeleton, EmptyState, Toast, StatCard, LargeHeader).
- **Font reality:** the brief says Syne + DM Sans, but the owner chose the live
  website fonts — **Bricolage Grotesque (display) + Plus Jakarta Sans (body)**.
  Payroll follows the EXISTING fonts/tokens, not the brief's Syne/DM Sans.
- The app is **locked to light mode** (matches the website). Honour that; the
  dark token set exists but is unused.

Everything else in the brief (spacing, radii, shadows, motion, a11y, skeleton-
first loading, pull-to-refresh, toasts, haptics, FlatList, safe areas) **applies
in full** to every new payroll screen.

> Pre-build ritual (per brief): re-read CLAUDE.md, ADMIN_MOBILE_APP.md,
> tasks/todo.md, tasks/lessons.md; skim the admin web pages + the existing
> earnings screens before writing code.

---

## 2. What we build on (current state — verified)

- **`driver_earnings`** (in `add_drivers.sql`): `driver_id`, `booking_id`,
  `booking_total`, `pay_percentage`, `gross_earnings`, `tip_amount`,
  `status` (`earnings_status` enum), `paid_at`, `created_at`.
- **`lib/driver-earnings.ts`** — `calculateDriverEarnings()`:
  `net = total − vat`, `gross = net × pay%`, `total = gross + tips`. Created on
  full-balance paid (Stripe webhook + manual mark-paid). Idempotent.
- **Endpoints:** `GET /api/admin/earnings`, `POST /api/admin/earnings/[id]/approve`,
  `POST /api/admin/earnings/[id]/pay`.
- **UI:** web `app/(admin)/admin/earnings`, mobile `app/earnings/index.tsx` +
  `hooks/useEarnings.ts` (More → Finance → Driver Earnings).

**Payroll does NOT replace earnings** — it aggregates them. A payslip references
the earnings rows it covers; marking a payslip paid marks those rows paid.

---

## 3. Data model (new tables — shared Supabase)

Worker-type-agnostic from day one (`worker_type` so cleaners slot in later).

```sql
-- 3.1 A payroll run for a date range (a "pay period" you process together)
CREATE TABLE pay_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE,                 -- e.g. PR-2026-0007
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'finalised' | 'paid' | 'cancelled'
  notes TEXT,
  created_by UUID,                       -- admin
  finalised_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 One payslip per worker per run
CREATE TABLE payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_run_id UUID NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
  worker_type TEXT NOT NULL,             -- 'driver' | 'cleaner'
  worker_id UUID NOT NULL,               -- drivers.id / cleaners.id
  gross_earnings NUMERIC(10,2) NOT NULL DEFAULT 0,  -- sum of covered gross
  tips_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
  adjustments_total NUMERIC(10,2) NOT NULL DEFAULT 0, -- + bonus / − deduction
  net_pay NUMERIC(10,2) NOT NULL DEFAULT 0,          -- gross + tips + adjustments
  jobs_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',-- 'pending' | 'paid'
  paid_at TIMESTAMPTZ,
  payment_method TEXT,                   -- 'bank_transfer' | 'cash'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pay_run_id, worker_type, worker_id)
);

-- 3.3 Link payslip ↔ the earnings rows it covers (audit + idempotency)
CREATE TABLE payslip_earnings (
  payslip_id UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
  earning_id UUID NOT NULL REFERENCES driver_earnings(id) ON DELETE CASCADE,
  PRIMARY KEY (payslip_id, earning_id),
  UNIQUE (earning_id)   -- an earning can only ever be on ONE payslip
);

-- 3.4 Manual adjustments (bonus / deduction / advance / expense)
CREATE TABLE payroll_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_id UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                    -- 'bonus' | 'deduction' | 'advance' | 'expense'
  label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,         -- signed: + adds, − subtracts
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

- Reuse `driver_earnings` as the line-item source for drivers. When cleaners earn,
  add a parallel `cleaner_earnings` table (same shape, separate table — decision
  made).
- **Idempotency:** `payslip_earnings.earning_id` is UNIQUE → an earning can
  never be double-paid across runs.
- **RLS:** admin (service role) full; a worker can read only their own payslips
  + adjustments (`worker_id` maps to their `drivers`/`cleaners` row); no anon.

---

## 4. Backend / API (Next.js routes, Zod-validated, errors → server_logs)

- `POST /api/admin/pay-runs` — create a run for `{ periodStart, periodEnd }`.
  **Generate**: find all `approved` earnings with a **paid date** in range
  (not already on a payslip), group by worker, create one `payslip` +
  `payslip_earnings` per worker, sum gross/tips, compute net. Returns the run
  with payslips.
- `GET /api/admin/pay-runs` — list runs (period, totals, status, worker count).
- `GET /api/admin/pay-runs/[id]` — run detail + payslips.
- `PATCH /api/admin/pay-runs/[id]/finalise` — lock the run (no more recompute).
- `POST /api/admin/payslips/[id]/adjustments` / `DELETE …/[adjId]` — add/remove
  bonus/deduction; recompute `adjustments_total` + `net_pay`.
- `PATCH /api/admin/payslips/[id]/pay` — mark a payslip paid (method) → set its
  covered `driver_earnings` rows to `paid` + `paid_at`; write activity_log;
  (optional) notify the worker.
- `PATCH /api/admin/pay-runs/[id]/pay-all` — mark every payslip in the run paid.
- `GET /api/admin/payslips/[id]/pdf` — render a payslip PDF (reuse the existing
  `@react-pdf/renderer` setup used for invoices/quotes).
- `GET /api/admin/pay-runs/[id]/export` — CSV for bank transfer (name, sort
  code/acct if stored, amount, reference).
- All admin routes use the existing **bearer-aware** `requireAdmin` so the
  **mobile app** can call them too.

---

## 5. Web admin — Payroll UI (this repo)

- **Nav:** add **Payroll** under FINANCE in `components/admin/AdminShell.tsx`
  (next to Driver Earnings; icon e.g. `Wallet`/`Banknote`). Keep "Driver
  Earnings" as the raw per-job view; Payroll is the run/period view.
- `app/(admin)/admin/payroll/page.tsx` — **pay runs list** (period, total net,
  workers, status badge) + "New pay run" (period picker w/ quick presets:
  This week / Last week / This month).
- `app/(admin)/admin/payroll/[id]/page.tsx` — **run detail**: summary header
  (period, totals, paid vs pending), a row per worker (avatar, name, jobs,
  gross, tips, adjustments, net, paid toggle), bulk **Pay all**, **Export CSV**,
  **Finalise**.
- **Payslip detail** (drawer/modal): covered jobs list, add bonus/deduction,
  **Download PDF**, **Mark paid** (method).
- Premium feel: cards, shadow-sm, brand purple, count-up on the totals,
  skeleton-first, empty/error states, toasts on every action.

---

## 6. Mobile admin — Payroll UI (admin-app) — to the brief's bar

Reuse the existing components/tokens; every screen gets skeleton-first load,
pull-to-refresh (purple), empty + error states, toasts, haptics on pay actions.

- **Entry point:** More → Finance → **Payroll** (above/below Driver Earnings).
  *(Optional later: a Payroll tab — not now; keep tabs as they are.)*
- `app/payroll/index.tsx` — pay-runs list (cards: period, net total via
  count-up, worker count, status pill). FAB → "New pay run".
- `app/payroll/[id].tsx` — run detail: totals hero, FlatList of worker payslip
  rows (avatar + name + net + paid pill), **Pay all** (confirm + haptic),
  **Export** (share sheet CSV), per-row tap → payslip detail.
- `app/payslip/[id].tsx` — payslip detail: covered jobs, adjustments
  (add bonus/deduction sheet), **Mark paid** (bank transfer/cash), **Share PDF**
  (open the `/pdf` URL).
- Hooks: `usePayRuns`, `usePayRunDetail`, `usePayslip` (TanStack Query — inherit
  the offline-encrypted cache already in place).
- Register routes in `app/_layout.tsx`.

---

## 7. Worker-facing payslips (driver / cleaner portals)

- Driver portal (`app/(drivers)/drivers/earnings`) gets a **Payslips** view:
  list of their payslips (period, net, paid/pending), tap → payslip detail +
  **Download PDF**. Read-only.
- When cleaners ship (cleanerstodo.md), the same view drops into their portal
  because payslips are `worker_type`-agnostic.
- Optional: notify the worker (email/SMS/push) when a payslip is marked paid.

---

## 8. Cleaners-readiness (zero rework later)

- `payslips.worker_type` + `worker_id` already generic.
- When cleaner earnings exist, the run generator simply also scans cleaner
  earnings for the period. No schema change to payroll tables.

---

## 9. Phased delivery (each phase: build → verify → Git push → review note)

- **Phase 0 — Schema + backend.** Migrations (`pay_runs`, `payslips`,
  `payslip_earnings`, `payroll_adjustments`, RLS, `pay_runs.reference`
  generator). Generation/finalise/pay/adjustment/export/PDF endpoints. Unit-
  sanity on the aggregation + idempotency.
- **Phase 1 — Web admin Payroll.** Nav + runs list + run detail + payslip
  detail + adjustments + mark-paid + CSV + PDF. (Web first: easier to validate
  the money maths on a big screen.)
- **Phase 2 — Mobile admin Payroll.** Screens/hooks to the brief's bar;
  routes; offline cache; verify `expo export` + dev bundle.
- **Phase 3 — Worker payslips.** Driver portal payslips view + PDF; optional
  paid notification.
- **Phase 4 — Polish.** Reports tie-in (payroll cost vs revenue), payslip
  email on finalise, cleaner-earnings hook-in once cleaners launch.

---

## 10. Business rules & edge cases (DECIDED)

- **Which earnings are eligible?** **APPROVED ONLY** — admin must approve each
  earning before it enters a run. Safer, more control.
- **Period basis:** group by the booking's **PAID DATE**. This matches cash flow
  reality — you pay for money actually collected.
- **Idempotency:** an earning can be on only one payslip (DB-enforced).
- **Re-running a draft:** regenerating a draft run re-pulls newly-eligible
  earnings; finalised runs are frozen.
- **Refund/void after pay:** if an invoice is later voided, flag the payslip;
  reconcile via an adjustment (don't silently mutate a paid payslip).
- **Partial pay / pay individuals:** allow per-payslip pay, not only whole-run.
- **Tips:** already on the earning; flow into payslip `tips_total`.
- **VAT:** earnings are already net-of-VAT; payroll never re-touches VAT.

---

## 11. Security / RLS / money-safety

- RLS on all four tables; workers read only their own payslips/adjustments;
  writes admin-only (service role via server routes).
- Marking paid is **transactional**: payslip + covered earnings flip together;
  on failure, nothing changes.
- Every payroll action → `activity_log`; errors → `server_logs`.
- Amounts are `NUMERIC(10,2)`; round at calculation, never trust client totals.

---

## 12. Verification checklist (apply to every payroll screen)

✓ Existing tokens only (colors/typography/tokens) — no raw hex/inline sizes ·
✓ slate-50 bg · ✓ skeleton-first · ✓ pull-to-refresh purple · ✓ empty + error
states · ✓ toast on every action · ✓ haptic on pay/confirm · ✓ 44pt targets ·
✓ a11y labels · ✓ money shown as £X,XXX.XX · ✓ dates DD/MM/YYYY ·
✓ mobile: `expo export` clean AND dev-server bundle HTTP 200, 0 resolve errors ·
✓ web: `tsc --noEmit` clean on changed files · ✓ Git push per phase ·
✓ lessons.md updated on any correction.

---

## 13. Decisions (FINAL)

1. ✅ **Eligibility:** **APPROVED ONLY** — admin must approve each earning first.
2. ✅ **Period basis:** **PAID DATE** — group by when money arrived.
3. ✅ **Default period:** **WEEKLY** — new runs default to the last 7 days.
4. ✅ **Bank details:** **STORE ENCRYPTED SORT CODE + ACCOUNT** — bank-ready CSV.
5. ✅ **Worker notification:** **EMAIL ONLY** — notify drivers when payslip paid.
6. ✅ **Cleaner earnings:** **PARALLEL `cleaner_earnings` TABLE** — separate from
   `driver_earnings` for isolation.

---

## 14. Phases Complete

### Phase 0 ✅ COMPLETE
Commit: `857e9b6` (2026-06-13)
- Database: 5 tables with full RLS
- Payroll lib: `generatePayRun()`, `markPayslipPaid()`, `markPayRunPaid()`
- 10 API endpoints (create/list/detail, finalise, pay single/bulk, adjustments, export, PDF)
- All auth-checked, transactional, idempotent

### Phase 1 ✅ COMPLETE
Commit: `18475cd` (2026-06-13)
- Pay runs list page (/admin/payroll)
- Run detail page (/admin/payroll/[id]) with totals + payslips table
- Create run form (date picker)
- Actions: Finalise, Export CSV, Pay all
- Nav item added to AdminShell under FINANCE
- Premium UI: cards, shadows, currency formatting, status pills
- Responsive grid layout

### Phase 2 — Mobile Admin Payroll (todo)
- Entry point: More → Finance → Payroll
- `app/payroll/index.tsx` — pay-runs list (cards, FAB)
- `app/payroll/[id].tsx` — run detail (totals hero, FlatList, Pay all, Export)
- `app/payslip/[id].tsx` — payslip detail (jobs, adjustments, mark paid, PDF)
- Hooks: `usePayRuns`, `usePayRunDetail`, `usePayslip` (TanStack Query)
- Routes registered in `app/_layout.tsx`
- Skeleton-first, pull-to-refresh, empty/error states, toasts, haptics

### Phase 3 — Worker Payslips (later)
- Driver portal: payslips view
- Read-only: period, net, paid/pending
- PDF download
- Email notification when paid (via background job)

### Phase 4 — Polish (later)
- Reports: payroll cost vs revenue
- Payslip email on finalise
- Cleaner earnings integration
