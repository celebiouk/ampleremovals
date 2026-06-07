## Task: Phase 6 — Polish, Performance, Security, Storage & Deployment

### Context
Phases 1-5 complete. Quote system complete. Multi-admin system complete.
Phase 6 = production hardening, security, performance, and deployment.
This is the FINAL phase. When complete, the platform goes live.

### Plan

#### SECTION 1 — FILE & DOCUMENT UPLOAD SYSTEM
- [ ] Create booking_documents table with RLS policies
- [ ] Create booking-documents Supabase Storage bucket
- [ ] Update lib/storage.ts with document upload/download/delete functions
- [ ] Create GET /api/admin/bookings/[id]/documents route
- [ ] Create POST /api/admin/bookings/[id]/documents route (with file validation)
- [ ] Create DELETE /api/admin/bookings/[id]/documents/[docId] route
- [ ] Build DocumentsPanel component with drag-and-drop
- [ ] Add DocumentsPanel to booking detail page
- [ ] Test file upload end-to-end

#### SECTION 2 — PUBLIC WEBSITE FINAL POLISH
- [ ] Homepage hero section — verify animations + CTA links
- [ ] Services section — verify all 5 cards link correctly
- [ ] How It Works section — update with real copy (not generic)
- [ ] Why Choose Us section — update with real trust signals
- [ ] Build Testimonials carousel section
- [ ] Build FAQ accordion section (10 questions)
- [ ] Footer — verify all links working, add social media icons
- [ ] Build About page (/about)
- [ ] Build Privacy Policy page (/privacy)
- [ ] Build Terms of Service page (/terms)
- [ ] Add cookie consent banner to public layout
- [ ] Build branded 404 page (app/not-found.tsx)
- [ ] Test all public pages on mobile (375px)

#### SECTION 3 — ADMIN DASHBOARD FINAL POLISH
- [ ] Audit: every table has loading skeleton
- [ ] Audit: every table has empty state
- [ ] Audit: every form has inline validation
- [ ] Audit: every destructive action has confirmation
- [ ] Audit: every action has toast notification
- [ ] Audit: no raw Supabase errors shown to user
- [ ] Audit: all currency values formatted as £X,XXX.XX
- [ ] Audit: all dates formatted as DD/MM/YYYY
- [ ] Audit: all page titles correct in browser tab
- [ ] Build password reset flow (forgot password)
- [ ] Add session expiry redirect to /admin/login
- [ ] Build AdminErrorBoundary component
- [ ] Mobile admin audit (test at 375px width)
- [ ] Test all admin pages for rough edges

#### SECTION 4 — SECURITY HARDENING
- [ ] 4A: Supabase RLS audit — verify all tables have RLS enabled
- [ ] 4B: Create lib/auth-check.ts helper (requireAdminAuth)
- [ ] 4B: Apply requireAdminAuth to all /api/admin/* routes
- [ ] 4C: Create lib/env-check.ts (startup environment validation)
- [ ] 4C: Audit .gitignore (confirm .env files excluded)
- [ ] 4D: Create lib/rate-limit.ts (in-memory rate limiter)
- [ ] 4D: Apply rate limiting to public API routes
- [ ] 4E: Install dompurify + jsdom
- [ ] 4E: Create lib/sanitise.ts (input sanitization)
- [ ] 4E: Apply sanitization to all booking submission routes
- [ ] 4F: Stripe webhook security audit
- [ ] 4G: Add CORS headers to public API routes
- [ ] 4H: Add security headers via next.config.js

#### SECTION 5 — PERFORMANCE OPTIMISATION
- [ ] 5A: Replace all <img> with Next.js <Image>
- [ ] 5B: Apply dynamic imports to heavy admin components
- [ ] 5C: Supabase query optimization (no select *, verify indexes)
- [ ] 5D: Install SWR and apply to admin data hooks
- [ ] 5E: Bundle size audit (npx next build)
- [ ] 5F: Font optimization (confirm next/font usage)

#### SECTION 6 — SEO AND METADATA
- [ ] 6A: Update root layout metadata with full OpenGraph
- [ ] 6B: Add metadata to all public pages
- [ ] 6C: Create app/sitemap.ts
- [ ] 6D: Create app/robots.ts
- [ ] 6E: Create favicon, apple-touch-icon, og-image

#### SECTION 7 — GLOBAL ERROR HANDLING
- [ ] 7A: Create app/error.tsx (global error boundary)
- [ ] 7B: Verify app/not-found.tsx exists
- [ ] 7C: Create app/loading.tsx (global loading)
- [ ] 7C: Create app/(admin)/admin/loading.tsx
- [ ] 7D: API error response audit (all return structured errors)

#### SECTION 8 — VERCEL DEPLOYMENT
- [ ] 8A: Create/update vercel.json (crons + function timeouts)
- [ ] 8B: Update next.config.js (images, headers, redirects)
- [ ] 8C: Document production Supabase setup steps
- [ ] 8D: Create docs/schema.sql (complete database schema)
- [ ] 8E: Document Vercel deployment steps
- [ ] 8F: Document custom domain setup steps

#### SECTION 9 — FINAL END-TO-END QA CHECKLIST
- [ ] Test: Public website (all sections load correctly)
- [ ] Test: All 5 booking wizards end-to-end
- [ ] Test: Admin dashboard (all major features)
- [ ] Test: Invoice generation + Stripe payment flow
- [ ] Test: Document upload/download/delete
- [ ] Test: Security (auth, rate limiting, RLS)
- [ ] Test: Performance (Lighthouse scores)
- [ ] Run: npx next build (no errors)
- [ ] Run: npx tsc --noEmit (no TypeScript errors)

#### SECTION 10 — DOCUMENTATION
- [ ] Create docs/schema.sql
- [ ] Create docs/api-reference.md
- [ ] Create docs/deployment.md
- [ ] Create docs/admin-guide.md
- [ ] Create docs/automation-rules.md

#### FINAL DELIVERABLES
- [ ] All checklist items above completed
- [ ] tasks/lessons.md updated with Phase 6 lessons
- [ ] Git commit: "feat: phase 6 complete — production ready"
- [ ] Git push to main
- [ ] Platform ready for production deployment

### Review
(To be filled after completion)
