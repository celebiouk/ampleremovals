## Task: Give white-label brands real Rubbish Removal pages + stop Ample location-page leak

### Context
Audit found 3 white-label domains (thatchammovers.co.uk, newburyremovals.co.uk, manyvans.com)
fall through to Ample-only pages with hardcoded `canonical: https://www.ampleremovals.com/...`
whenever a path isn't one of the 6 exact paths middleware rewrites. Two sub-problems:
1. Rubbish Removal has no brand page at all (Removals/Man and Van/House Clearance all do).
2. Any Ample `[hub]/[village]` or `/locations/[location]` URL hit on a brand domain serves
   Ample's own branded content + a canonical pointing at ampleremovals.com — the exact
   disguise-breaking leak already fixed once for the landing page and locations page.
User decision: don't clone Ample's 170-village grid for brands that serve 1-2 towns each.
Instead (1) give brands a real Rubbish Removal page matching the existing pattern, and
(2) redirect Ample-only location URLs back to the brand's own real page when hit cross-domain,
instead of serving/leaking Ample's content.

### Plan
- [x] Add `thatchamMoversRubbishRemoval`, `newburyRemovalsRubbishRemoval`, `manyVansRubbishRemoval`
      content objects (mirrors the existing House Clearance pattern — instant hourly quote widget,
      same `house_clearance` booking service under the hood)
- [x] Add `app/(brands)/<slug>/rubbish-removal/page.tsx` for all 3 brands
- [x] middleware.ts: add `/rubbish-removal` to `BRAND_PAGE_PATHS`
- [x] middleware.ts: redirect (not rewrite) Ample-only `[hub]/[village]` + `/locations/[location]`
      URLs to the brand's own equivalent top-level page when hit on a non-ample brand domain
- [x] Typecheck / build
- [x] Commit + push

### Review
Added Rubbish Removal as a real 4th service for all 3 white-label brands (content + pages),
matching the existing House Clearance page pattern exactly (same InstantHourlyQuoteWidget,
£45/£70 hourly rates, same BrandPageShell). Added "/rubbish-removal" to the middleware's
brand-page rewrite set so it gets the same treatment as /man-and-van and /house-clearance.

Fixed the real leak: previously any Ample `[hub]/[village]` location URL (man-and-van,
house-clearance, house-removals, rubbish-removal, or /locations/[x]) hit on
thatchammovers.co.uk / newburyremovals.co.uk / manyvans.com fell through to Ample's own
page, which has a hardcoded `canonical: https://www.ampleremovals.com/...` — telling Google
the brand's copy is a duplicate of Ample's, and showing Ample branding/phone number to a
brand's own visitors. Those URLs now 308-redirect to the brand's real equivalent page
(e.g. any `/man-and-van/<hub>/<village>` on a brand domain → that brand's own `/man-and-van`;
any `/locations/<x>` → that brand's `/`) instead of leaking Ample's content cross-domain.

Did not build Ample's full 16-hub/170-village page grid for the brands — they serve 1-2 towns
each, and faking regional coverage they don't offer would be spam, not SEO. Each brand's
existing single page per service already names its own town(s) by design (see e.g. ManyVans'
"Newbury & Thatcham" copy, which deliberately treats both as one patch rather than splitting
into separate landing pages).

## Task: Ample Logistics B2B lead-gen + Gmail outreach engine
### Context
Separate from amplelogistics.co.uk (which stays as-is: HGV driver recruitment agency,
untouched). This is a NEW service on ampleremovals.com: Ample Removals' one-Luton-van
delivery/collection subcontracting offer to local businesses (furniture retailers, couriers,
warehouses, etc.), with its own page, lead CRM, and automated Gmail outreach from
daniel@ampleremovals.com. Decisions confirmed with owner:
- New package: `googleapis` (official Gmail API client).
- Lead discovery source: Google Places API (owner creates the GCP project/key — browser step,
  cannot be scripted).
- Hosted at ampleremovals.com/logistics + a homepage mention, not a new brand/domain.

### Plan — Phase 1 (no external credentials needed, do now)
- [x] Migration `add_delivery_leads.sql`: tables `delivery_leads` (business_name, category,
      website, email, phone, address, postcode, distance_miles, source, discovered_at,
      score, band, status, capacity_notes, est_jobs_per_week, potential_value, excluded_reason),
      `delivery_lead_email_threads` (gmail_thread_id, lead_id, direction, classification,
      snippet, created_at), `delivery_lead_followups` (lead_id, due_at, sequence_step, sent_at),
      `delivery_lead_suppression` (email unique, reason, created_at). RLS: service-role only
      (no public/anon access — this is internal CRM data, no public insert path).
- [x] `lib/delivery-leads.ts`: types, the exclusion list (removal/man-and-van/house-clearance
      businesses), category labels, scoring weights (one-van capacity fit, distance,
      category priority).
- [x] Public page `app/(public)/logistics/page.tsx` — explains the delivery/collection
      subcontracting offer, who it's for, CTA = contact form (reuse existing contact
      patterns), one-van capacity framed honestly (no false fleet claims).
- [x] Homepage: add a small services-row card or footer link to `/logistics`.
- [x] Admin CRM: `app/(admin)/admin/delivery-leads/page.tsx` (list + filters: category,
      distance, score band, status) and `[id]/page.tsx` (detail: contact info, score
      breakdown, email thread, follow-up tasks, manual status override).
- [x] `app/api/admin/delivery-leads/route.ts` + `[id]/route.ts` (list/detail/update, admin
      session check like every other `/api/admin/*` route).
- [x] Typecheck/build, commit + push.

### Plan — Phase 2 (needs owner to create a Google Cloud project + Places API key)
- [ ] `lib/delivery-lead-discovery.ts`: Places API nearby-search by category around
      Thatcham + Newbury, 20mi radius, merge/dedupe by domain+address+name, apply exclusion
      list, score, insert new rows (skip existing).
- [ ] `app/api/cron/delivery-lead-discovery/route.ts` + add to `vercel.json` crons (daily).
- [ ] Env var needed from owner: `GOOGLE_PLACES_API_KEY`.

### Plan — Phase 3 (needs owner to create a Google Cloud OAuth client + do one browser consent
      as daniel@ampleremovals.com)
- [ ] `lib/gmail.ts`: OAuth2 client via `googleapis`, token refresh, send message, list/read
      thread, using scopes limited to gmail.send + gmail.readonly/modify.
- [ ] `app/api/admin/delivery-leads/gmail/connect/route.ts` (OAuth init) +
      `.../callback/route.ts` (exchange code, store encrypted refresh token — service-role
      only table, never exposed client-side).
- [ ] Env vars needed from owner: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`.

### Plan — Phase 4 (outreach automation + UK PECR compliance)
- [ ] Email templates per category (furniture/appliance retailers, couriers, logistics,
      warehouses/e-commerce) — no fabricated claims (insurance, fleet size, staff) per spec.
- [ ] Eligibility check: corporate subscriber vs sole trader/partnership (heuristic from
      Companies House lookup where possible), suppression list check, before every send.
- [ ] Unsubscribe handling route + permanent suppression; never re-import suppressed.
- [ ] `app/api/cron/delivery-lead-outreach/route.ts`: sends eligible queued proposals,
      respects a daily send cap + a kill-switch flag (admin-settable), logs every send.
- [ ] Admin kill switch + campaign pause toggle in the CRM UI.

### Plan — Phase 5 (reply monitoring)
- [ ] `app/api/cron/delivery-lead-gmail-poll/route.ts`: polls the Gmail thread, classifies
      replies (interested / wants pricing / not interested / unsubscribe / auto-reply /
      unclear) via keyword rules, updates lead status + thread log, creates a follow-up task,
      notifies daniel@ampleremovals.com on "interested" (reuses existing notification lib).

### Plan — Phase 6 (follow-up sequence + dashboard polish)
- [ ] Configurable follow-up intervals (5 business days, then +7), respecting suppression/
      opt-out, stopping immediately on objection.
- [ ] Admin dashboard stats: discovered/qualified/sent/replied/interested/converted/suppressed,
      filterable by category/location/score/status.

### Review
(fill in as phases complete)
