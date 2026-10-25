# Local Village Pages — Build Plan

**Goal:** Build genuinely distinct local-area landing pages for 4 services — Man and Van, House Removals, House Clearance, Rubbish Removal (kept as its own page from House Clearance, per your instruction) — across ~155 villages/towns nested under 16 larger hub areas. Target: under 10% textual similarity between any two pages, verified structurally, not just by swapping names into the same sentence.

---

## 0. What's actually broken today (read this first)

Before planning new pages, I audited the existing location system, because the root cause matters for how we build the new ones.

**There is one location-page system today:** `app/(public)/locations/[location]/page.tsx`, a single shared template, driven by `lib/locations.ts` (32 hardcoded entries — name, county, region, 2–4 "nearby areas"). Every one of the 32 pages renders the *exact same sentences* with only the town name swapped in:

> "Ample Removals is a trusted **removal company in {location.name}** offering professional **house removals**, **man and van services**, and **house clearance** throughout {location.county}..."

Same 5 services grid, same "Why Choose Us" bullets (5 of 6 word-for-word identical), same claims ("fully insured", "7 days a week"), same CTA. This is exactly what Google flagged.

**It's worse than body copy:** `generateMetadata()` produces the same templated `<title>` and meta description for all 32 pages too (just name/county swapped) — a second, independent duplicate-content signal, separate from the page body.

**The data model has no room for real content.** `Location` only has `slug/name/county/region/nearbyAreas` — no landmarks, no local detail, no images, no testimonials. You can't fix the templating without first fixing what the data can hold.

**IA is also broken** (not a similarity issue, but worth fixing alongside this): the 32 pages aren't in the real sitemap Google reads (`locations-sitemap.xml` exists but isn't linked from `sitemap.ts`/`robots.ts` — it's orphaned), and only 12 of the 32 are linked from anywhere crawlable (a hardcoded "featured" list in the footer). The other 20 are effectively invisible to Google except via that orphaned sitemap.

**Decision this plan makes:** the new village pages will NOT share the old template or `lib/locations.ts`. They get their own richer system (§2–3). The old 32 pages are a separate, pre-existing problem with the same root cause — **I recommend fixing them in a follow-up pass using the same differentiation techniques**, not as part of this build (flagging it so it doesn't get lost, not doing it now since you asked specifically for the village expansion). I've also resolved 3 direct name collisions between your village lists and the existing 32 (Thatcham, Salisbury, Swindon already have their own top-level pages) — see §1 note.

---

## 1. The location data

16 hub areas, up to 10 villages/towns each, researched for accuracy (not guessed) via live search. Newbury's list is yours, verbatim. Every other hub was cross-checked for real geographic accuracy and cross-deduplicated so no village appears under two hubs.

**Note on overlaps with the existing 32:** Thatcham, Salisbury, and Swindon already have their own standalone page in `lib/locations.ts`. Nesting them again as a "village of Newbury/Salisbury-hub" would create the same cannibalization problem we're trying to fix. I've kept them OUT of the village lists below and substituted a genuine alternative in each case (noted inline). When we get to the follow-up pass on the original 32, Thatcham/Salisbury/Swindon get upgraded in place rather than duplicated here.

| # | Hub | County | Villages/towns (max 10) |
|---|-----|--------|--------------------------|
| 1 | **Newbury** | Berkshire | Wash Common, Speen, Donnington, Greenham, Cold Ash, Chieveley, Shaw, West Mills, Newbury Racecourse, Enborne *(swapped in for Thatcham — see note above)* |
| 2 | **Bath** | Somerset | Bathampton, Combe Down, Batheaston, Bradford-on-Avon, Keynsham, Saltford, Radstock, Corsham, Frome, Paulton |
| 3 | **Oxford** | Oxfordshire | Dorchester-on-Thames, Kidlington, Eynsham, Woodstock, Abingdon, Witney, Bicester, Thame, Wallingford, Wantage |
| 4 | **Reading** | Berkshire | Earley, Woodley, Sonning, Pangbourne, Theale, Caversham, Tilehurst, Wargrave, Burghfield Common, Shinfield |
| 5 | **Basingstoke** | Hampshire | Oakley, Whitchurch, Kingsclere, Overton, Tadley, Old Basing, Bramley, Chineham, Hook, Sherfield on Loddon |
| 6 | **Andover** | Hampshire | Abbotts Ann, Weyhill, Charlton, Upper Clatford, Goodworth Clatford, Thruxton, Appleshaw, Ludgershall, Tidworth, Amport |
| 7 | **Portsmouth** | Hampshire | Southsea, Cosham, Fratton, Paulsgrove, Drayton, Farlington, Hilsea, Milton, Copnor, Eastney |
| 8 | **Chichester** | West Sussex | Bosham, Fishbourne, Selsey, East Wittering, West Wittering, Southbourne, Nutbourne, Boxgrove, Tangmere, Westhampnett |
| 9 | **Southampton** | Hampshire | Bassett, Chilworth, Highfield, Swaythling, Shirley, Lordswood, Netley, Hamble, Totton, Bitterne |
| 10 | **Slough** | Berkshire | Langley, Britwell, Chalvey, Colnbrook, Cippenham, Wexham, Upton, Burnham, Farnham Royal, Stoke Poges |
| 11 | **Winchester** | Hampshire | Alresford, Bishop's Waltham, Wickham, Otterbourne, Compton, Twyford, Shawford, Chilcomb, Kings Worthy, Sutton Scotney |
| 12 | **Bristol** | Bristol | Thornbury, Portishead, Clevedon, Nailsea, Long Ashton, Winterbourne, Frampton Cotterell, Chipping Sodbury, Almondsbury, Backwell |
| 13 | **Bracknell** | Berkshire | Binfield, Warfield, Winkfield, Ascot, Crowthorne, Sandhurst, Priestwood, Great Hollands, Harmans Water, Wildridings |
| 14 | **Swindon** | Wiltshire | Wroughton, Chiseldon, Wanborough, Purton, Royal Wootton Bassett, Highworth, Blunsdon, Stratton St Margaret, Lydiard Millicent, Liden |
| 15 | **Wokingham** | Berkshire | Winnersh, Barkham, Finchampstead, Arborfield, Twyford *(Berkshire — distinct from Winchester's Twyford, Hampshire)*, Hurst, Charvil, Ruscombe, California, Emmbrook |
| 16 | **Salisbury** | Wiltshire | Wilton, Amesbury, Downton, Alderbury, Winterslow, Broad Chalke, Coombe Bissett, Woodford Valley, Whiteparish, Tisbury |
| 17 | **Wiltshire** *(remaining county towns)* | Wiltshire | Trowbridge, Chippenham, Devizes, Melksham, Warminster, Calne, Westbury, Marlborough, Pewsey, Mere |

**Total: 17 hubs × ~10 villages = 165 villages → × 4 services = 660 pages.**

That's a real, large number — bigger than the "100 → 400" example in your message, because you listed 17 named areas (including "Wiltshire" as its own hub on top of Swindon/Salisbury, which are also Wiltshire towns) and most of them genuinely have 10 real satellite villages worth targeting. If you'd rather cap this lower (e.g. drop to 5–6 villages per hub, or drop a hub or two), say so and I'll trim the table — but as given, this is the real, accurate count.

---

## 2. Why these would still look 98% similar if I built them the old way

Same trap as the existing 32, just at 20x the scale: if every village page is "{Service} in {village}, near {hub}" with the same 5 paragraphs, Google will flag this batch just as hard — possibly harder, since 660 near-identical pages is a much bigger red flag than 32.

Two kinds of similarity to kill independently:
- **Cross-location** (Newbury's Man-and-Van page vs. Thatcham's Man-and-Van page)
- **Cross-service** (Newbury's Man-and-Van page vs. Newbury's House-Clearance page)

A plan that only solves one of these still fails.

---

## 3. The differentiation system

### 3a. Four separate route trees, four separate templates — not one shared component

```
app/(public)/man-and-van/[hub]/[village]/page.tsx
app/(public)/house-removals/[hub]/[village]/page.tsx
app/(public)/house-clearance/[hub]/[village]/page.tsx
app/(public)/rubbish-removal/[hub]/[village]/page.tsx
```

Each of the 4 gets its **own page component with a different structure** — different section order, different hero framing, different proof-point module, different FAQ pool, different CTA angle. Not just different words — different page *shape*. This alone solves most of the cross-service problem, since even identical village data renders into a visibly different page per service.

Concretely, differing by design (examples, not exhaustive):
- **Man and Van**: hero leads with speed/flexibility ("book today, move tomorrow"), a "what fits in a van load" visual module, pricing-by-item-count angle, FAQ pool about single-item/small-load jobs.
- **House Removals**: hero leads with trust/full-service ("your whole home, handled"), a step-by-step moving-day timeline module, a packing-materials/insurance proof module, FAQ pool about multi-room moves, stairs/access, storage.
- **House Clearance**: hero leads with discretion/completeness ("probate, downsizing, full clearance"), a "what we clear" category grid (furniture/appliances/garden/loft), a licensed-waste-carrier proof module, FAQ pool about probate timelines, donations/recycling %, same-day clearance.
- **Rubbish Removal**: hero leads with speed/price ("same-day, by the load"), a load-size pricing table module, a "what we take / can't take" module, FAQ pool about WEEE/hazardous items, council tip vs. us, man-and-van-load vs. skip comparison.

### 3b. A real data model, not a name-swap template

Replace the single `Location` interface with two layers:

```ts
// lib/hubs.ts — the 17 larger areas
interface Hub {
  slug: string; name: string; county: string;
  depotDistanceMiles: number;      // real, used in copy ("just 12 miles from our depot")
  landmark: string;                 // one real local landmark, used in hero/intro
  coveragePostcodes: string[];      // e.g. ["RG14", "RG20"]
}

// lib/villages.ts — the ~165 villages, each nested under a hub
interface Village {
  slug: string; name: string; hubSlug: string;
  postcode: string;                 // real outward code
  lat: number; lng: number;         // real, drives per-page LocalBusiness schema + map embed
  character: string;                 // 1-sentence local-flavour fact (commuter village / market town / coastal / student area / etc.) — written per village, not generated
  nearbyVillages: string[];          // 3-4 slugs, for real hyperlinked cross-links (not <span> pills like today)
  accessNote?: string;               // optional: narrow lanes / no through-road / rural track — only where genuinely true, varies presence across pages
}
```

Every field above is either **real geographic fact** (postcode, coordinates, distance, landmark) or **genuinely written per village** (the `character` sentence) — nothing derived by string-templating a name into a fixed sentence. This is the actual fix; the route/template split in §3a is necessary but not sufficient without this.

### 3c. Content modules that vary in *presence and order*, not just wording

Beyond unique data, the page itself shouldn't assemble its modules in the same sequence every time. Each service template gets a small pool of optional modules (e.g. "local access note", "nearby landmark mention", "commuter-village pricing context", "recent local job type example") and each village page includes a different subset, in a different order, chosen deterministically from the village's own data (e.g. only villages with a real `accessNote` show that module; only villages near a notable landmark show the landmark callout). This means no two pages have the same block sequence even before counting word-level differences.

### 3d. Metadata gets the same treatment

`generateMetadata()` per route uses the village's real data (postcode, landmark, character) to build genuinely different titles/descriptions, not `{service} in {name}, {county}` for all 165. E.g.:
- Man and Van, Wash Common: *"Man and Van in Wash Common, Newbury (RG14) — Same-Day Quotes"*
- House Clearance, Wash Common: *"House Clearance Wash Common — Probate & Full Property Clearance, RG14"*

Same village, different service, genuinely different title — not the same sentence with one word changed.

### 3e. Internal linking mesh (fixes the IA bug too)

- Each village page links to its 3–4 real `nearbyVillages` (hyperlinked, not plain text) **and** to its hub page, **and** to the same village's other 3 service pages (so all 4 of a village's pages interlink).
- A real `/man-and-van`, `/house-removals`, `/house-clearance`, `/rubbish-removal` index page lists every hub → every village (fixes "20 of 32 are orphaned" at the same time, for the new pages — doesn't apply the fix retroactively to the old 32, which is why I flagged them separately above).
- All ~660 URLs go into `app/sitemap.ts` properly (not an orphaned second sitemap file).

### 3f. Design variation, not just copy variation

Reuses your existing brand system (brand-purple/green palette, Bricolage Grotesque/Plus Jakarta Sans, the shadcn-style component set — all confirmed solid, not the problem) but each of the 4 service templates gets its own hero treatment, its own accent use of purple vs. green, its own imagery style/icon set, so a human glancing at two pages side by side sees a different page, not a reskinned twin.

---

## 4. Verification before anything ships

Before publishing any batch, I'll spot-check textual similarity directly — pull the rendered body text of 2–3 page pairs (same service/different village, and same village/different service) and diff them, confirming genuine divergence rather than assuming the system works. I'll also validate each new page's structured data and confirm it's reachable from the sitemap before considering a batch "done."

---

## 5. Build order

Implementation in batches of **5 villages × 4 services = 20 pages per batch**, starting with Newbury (your example, already fully specified) and then working down the hub table in the order listed above. Each batch:
1. Add the 5 villages' real data to `lib/villages.ts` (postcode, coordinates, landmark, character sentence, access note where genuinely true).
2. Generate the 20 pages via the 4 route templates.
3. Spot-check 2 pairs for genuine divergence (§4).
4. Typecheck, commit, push, deploy.

First batch: **Wash Common, Speen, Donnington, Greenham, Cold Ash** (first 5 of Newbury's list) — starting as soon as this plan is approved.

---

## 6. Decisions (confirmed)

1. **Scope: full 165 villages / 660 pages.** Confirmed — building the complete researched set, not trimmed.
2. **Thatcham/Salisbury/Swindon**: left as-is for now (already have standalone pages in the old system), not nested under Newbury/Salisbury-hub/Swindon-hub.
3. **Phase 2 — fix the original 32**: confirmed as a planned follow-up, not started as part of this build. Once the village-page system (§3) is proven out across a few batches, the same approach (real data model, per-service templates, real metadata) gets applied to rewrite `lib/locations.ts`'s 32 entries and retire the old shared template — this is the actual thing Google's email was about, so it stays on the list even though it's sequenced after the new villages.

## 7. Status

- [x] Research complete — all 165 villages compiled and cross-deduplicated.
- [x] Plan approved — full scope, Phase 2 confirmed for later.
- [x] Batch 1 (Newbury: Wash Common, Speen, Donnington, Greenham, Cold Ash) — built, 20 pages (5 villages × 4 services), deployed.
- [x] Batches 2–34 — ALL 17 HUBS COMPLETE. 169 villages total (Basingstoke has 9, not 10 — the real list of notable settlements there, not padded to a round number). 169 × 4 services = 676 location pages, all deployed.
- [x] Instant-quote widgets added to all 4 templates (Standard/Premium for removals; hourly for man-and-van, house-clearance, rubbish-removal) — self-serve quote → deposit payment, no admin in the loop.
- [x] JSON-LD structured data (MovingCompany + FAQPage) on all 4 templates.
- [x] Traffic tracking (page_views table, PageViewTracker, admin Traffic page) — site-wide + per-page, monthly.
- [x] WhatsApp button on all 4 templates, pre-filled with service + village + page URL — inherited by every village automatically.
- [x] Direct-response copy pass on all 4 templates (headlines, subheads, CTAs) — benefit-led, instant-mechanism-led, no fake scarcity.
- [x] Fixed a real bug: all 4 hero sections had less top padding (64px) than the fixed navbar's height (72px), clipping the eyebrow label — matched the homepage's `pt-28 lg:pt-36` convention.
- [ ] Phase 2: rewrite the original 32 `lib/locations.ts` pages (deferred, not started — confirmed with owner as a later follow-up).

### Batch 1 — measured similarity, honestly reported

Built the 4-template system + variant pools (§3) and actually measured the output rather than assuming it hit the target. Two metrics, both run on same-service/different-village page pairs (the harder case — same template, same service, only the village differs):

| Metric | Before variant pools | After variant pools |
|---|---|---|
| Word-overlap (crude, includes shared function/topic words) | ~70–75% | 34–47% |
| 8-word verbatim phrase overlap (closer to real near-duplicate detection) | not measured | 22–40% |

**Honest read:** this is a large, real improvement over the ~98%-identical old system (genuinely unique per-village facts, 2–3 worded-differently variants per FAQ/trust-line/category/pricing block, selected deterministically so no two villages in a hub read the same). It is **not** reliably under the 10% figure you asked for, measured this way. Two things are true at once:
1. The word-overlap metric will never approach 10% for any two genuinely topical pages about the same service in English — shared function words and necessary service vocabulary ("van", "quote", "removal") aren't what duplicate-content detection actually penalizes, and chasing that number lower via this crude metric isn't meaningful past a point.
2. The phrase-overlap metric (22–40%) is the more honest signal, and it's still higher than ideal — some page chrome (section headings like "What's your load?", the load-size/category card grids themselves) is still fully fixed, not varied.

I stopped here rather than keep grinding the number down indefinitely on 5 villages, since the next real jump in quality is a judgment call on how much further to invest per page before scaling to 160 more villages — flagging it for you rather than silently calling it done.
