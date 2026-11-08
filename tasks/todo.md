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
