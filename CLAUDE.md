````markdown
# CLAUDE.md — Removal Company Booking & CRM Platform
**Project Owner:** CCMendel (Rafael / Chinedu Daniel Chimezie)
**Version:** 1.0 | Confidential

---

## WHAT THIS PROJECT IS

This is a full-stack removal company platform with two parts:
1. A **public-facing booking website** where customers request removal and cleaning services
2. A **protected admin CRM dashboard** where the team manages leads, jobs, invoices, and communications

This project belongs to CCMendel. Treat every instruction in this file as law.

---

## WHO YOU ARE TALKING TO

CCMendel is a vibe coder and serial entrepreneur. He uses AI tools to build production apps.
He understands concepts quickly but does not want to be given raw code dumps without context.
Speak clearly. Explain what you are doing and why at each step.
Never assume he knows a terminal command — always write it out in full.
Never ask him to do something manually in a browser or dashboard if you can do it via code, API, CLI, or automation.

**Examples of things you should NEVER ask him to do manually:**
- "Go to Vercel and redeploy" — trigger the build via `vercel --prod` or push to git instead
- "Open Supabase and run this SQL" — only ask this if it genuinely cannot be scripted
- "Manually update your .env" — give him the exact lines to paste, never make him figure it out
- "Go to Stripe dashboard and create a product" — use the Stripe CLI or SDK instead

---

## GOLDEN RULES

1. **ALWAYS push to Git after every completed iteration.** No exceptions. Every phase, every feature, every fix.
2. **Never mark something done without proving it works.** Test it. Check the logs. Show the result.
3. **Never break what already works.** Minimal impact — only touch what is needed for the current task.
4. **Plan before building.** For any task with 3+ steps or an architectural decision, write a plan first.
5. **Fix bugs autonomously.** When given a bug report, diagnose and fix it. Do not ask for hand-holding.
6. **No hacky fixes.** If a solution feels like a workaround, stop and implement it properly.
7. **Always write the elegant solution.** After solving something, ask: "Would a senior engineer approve this?" If no, redo it.

---

## TECH STACK

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router, TypeScript) |
| Database & Backend | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Styling | Tailwind CSS + Shadcn/UI |
| Animations | Framer Motion |
| Email | Resend |
| SMS | Twilio |
| Payments & Invoicing | Stripe + @react-pdf/renderer |
| Address Lookup | postcodes.io (free UK API, no key needed) |
| File Storage | Supabase Storage |
| Charts | Recharts |
| Hosting | Vercel |
| Version Control | Git + GitHub |

**Do not introduce new packages without explaining why and getting confirmation.**

---

## SERVICES THIS PLATFORM COVERS

1. **Removals** (default service on homepage)
2. **Man and Van**
3. **House Clearance**
4. **House Cleaning**
5. **End of Tenancy Cleaning**

---

## BRAND

- **Primary colour:** Purple `#6b21a8`
- **Accent colour:** Green `#16a34a`
- **Base:** White `#ffffff`
- **Display font:** Syne (headings)
- **Body font:** DM Sans
- **Feel:** Premium, smooth, professional. Inspired by comparemymove.com.

---

## FOLDER STRUCTURE

```
app/
  (public)/
    page.tsx                    ← homepage
    booking/[service]/page.tsx  ← booking wizard per service
    confirmation/page.tsx
    layout.tsx
  (admin)/
    admin/
      page.tsx                  ← dashboard overview
      bookings/page.tsx
      bookings/[id]/page.tsx    ← individual booking CRM view
      customers/page.tsx
      invoices/page.tsx
      reports/page.tsx
      login/page.tsx
      layout.tsx
  api/
    bookings/
      removals/route.ts
      man-and-van/route.ts
      house-clearance/route.ts
      house-cleaning/route.ts
      end-of-tenancy/route.ts
    postcode/lookup/route.ts
    webhooks/stripe/route.ts
  layout.tsx
  globals.css

components/
  ui/                  ← Shadcn auto-generated
  shared/              ← Navbar, Footer, StepIndicator, ServiceCard
  booking/             ← All booking wizard step components
  admin/               ← All admin dashboard components

lib/
  supabase/client.ts   ← browser client
  supabase/server.ts   ← server client (App Router)
  resend.ts
  twilio.ts
  stripe.ts
  postcode.ts
  utils.ts             ← cn(), generateBookingReference(), formatCurrency()

hooks/
  useBookingForm.ts
  usePostcodeLookup.ts
  useAdminAuth.ts

types/
  index.ts             ← ALL TypeScript interfaces

middleware.ts           ← protects /admin/* routes
tasks/
  todo.md              ← active task list with checkboxes
  lessons.md           ← running log of mistakes and how to avoid them
```

---

## BOOKING STATUS PIPELINE

Every booking moves through this pipeline. These are the ONLY valid statuses:

```
inquiry → called | not_called → answered | not_answered
→ processing → pending
→ deposit_invoice_sent → deposit_paid_job_confirmed
→ full_invoice_sent → full_balance_paid
→ job_completed

Side exits: bad_lead | not_a_good_fit
```

Every status change must:
- Update the `bookings` table
- Write a new row to `status_history`
- Write an entry to `activity_log`

---

## BOOKING REFERENCE FORMAT

| Service | Prefix | Example |
|---|---|---|
| Removals | RMV | RMV-2026-X8K4P |
| Man and Van | MAV | MAV-2026-3TZ9W |
| House Clearance | HCL | HCL-2026-M2RQN |
| House Cleaning | CLN | CLN-2026-7BVFA |
| End of Tenancy | EOT | EOT-2026-K5YJD |

Invoice format: `INV-2026-XXXXX`

---

## TASK MANAGEMENT PROTOCOL

Before starting ANY non-trivial work:

1. Write the plan to `tasks/todo.md` as a checklist
2. State the plan clearly before starting
3. Check off items as they are completed
4. Write a summary of what was done at the end
5. If a mistake was made and corrected, add the lesson to `tasks/lessons.md`
6. Push to Git

**tasks/todo.md format:**
```markdown
## Task: [Name]
### Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

### Review
What was done, what worked, what to watch out for.
```

**tasks/lessons.md format:**
```markdown
## Lesson [N] — [Short title]
**What happened:** ...
**Root cause:** ...
**Rule going forward:** ...
```

---

## DATABASE RULES

- RLS enabled on ALL tables — no exceptions
- Public (anon) users can only INSERT into booking-related tables
- All admin reads/writes use the service role key via server-side routes
- Never expose the service role key to the client
- All foreign keys must have ON DELETE CASCADE or ON DELETE SET NULL explicitly set
- All tables must have `created_at TIMESTAMPTZ DEFAULT NOW()`

---

## API ROUTE RULES

- All booking submission routes use Zod for server-side validation
- Every route returns `{ success: true, reference: string }` on success
- Every route returns `{ success: false, error: string }` on failure
- Errors are written to the `server_logs` table — never just console.log
- Resend/Twilio failures must NOT fail the booking — log and continue
- All `/admin/*` API routes must verify the Supabase session server-side before executing

---

## DESIGN RULES

- Mobile-first on every component — test at 375px width first
- No blank/empty states without a helpful placeholder message
- Every data table must have: loading skeleton, empty state, error state
- Smooth transitions on all step changes in the booking wizard (Framer Motion)
- Toast notifications for every admin action (saved, sent, error)
- Confirmation dialogs before any destructive action (delete, cancel)
- All monetary values displayed as `£X,XXX.XX`
- All dates displayed as `DD/MM/YYYY` (UK format)

---

## CODE STANDARDS

- TypeScript strict mode — always use explicit types, never `any`
- No inline logic — extract to hooks in `/hooks` or utility functions in `/lib/utils.ts`
- Components are small and single-purpose
- Well-commented — explain the "why", not just the "what"
- No commented-out dead code in commits
- All environment variables accessed via `process.env.VARIABLE_NAME` — never hardcoded

---

## GIT WORKFLOW

After every completed phase, feature, or meaningful iteration:

```bash
git add .
git commit -m "feat: [short description of what was built]"
git push origin main
```

Commit message prefixes:
- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — config, dependencies, setup
- `style:` — styling only change
- `refactor:` — code restructure, no behaviour change
- `docs:` — documentation update

---

## PHASES OVERVIEW

| Phase | Focus |
|---|---|
| 1 | Project scaffold, Supabase schema, brand system, base components, homepage shell |
| 2 | Public multi-step booking wizard for all 5 services |
| 3 | Booking submission API, Resend emails, Twilio SMS, postcode proxy |
| 4 | Admin dashboard, CRM pipeline, status management, notes, activity log |
| 5 | Invoicing, PDF generation, Stripe payment links, webhook handling |
| 6 | Polish, file storage, security hardening, Vercel deployment |

Current active phase is tracked in `tasks/todo.md`.

---

## SKILLS AVAILABLE

The following skills are available in `/mnt/skills/public/`. Read the relevant SKILL.md
before working on that file type:

- `frontend-design/SKILL.md` — UI components, layouts, design system
- `docx/SKILL.md` — Word document generation
- `pdf/SKILL.md` — PDF creation and filling
- `xlsx/SKILL.md` — Spreadsheet generation
- `pptx/SKILL.md` — Presentation generation
- `file-reading/SKILL.md` — Reading uploaded files of any type

**Always read the relevant SKILL.md before writing code for that output type.**

---

## ENVIRONMENT VARIABLES REFERENCE

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

RESEND_API_KEY=
RESEND_FROM_EMAIL=bookings@yourcompany.com
RESEND_ADMIN_EMAIL=admin@yourcompany.com

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit `.env.local` to Git. It is in `.gitignore` by default.

---

*This file is the source of truth for this project. When in doubt, refer back here.*
````