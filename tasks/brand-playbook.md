# Multi-Brand Playbook — Adding a New Town Domain

This is the step-by-step recipe for adding another white-label brand (e.g.
`readingremovals.co.uk`, `didcotremovals.co.uk`, `abingdonremovals.co.uk`,
`basingstokemovers.co.uk`) on top of the same system that runs Ample
Removals, Thatcham Movers, Newbury Removals and ManyVans. Follow this in
order — each step points at the real file to copy/edit.

## What "a brand" actually is

One Next.js app, one Supabase database, one admin dashboard — all shared.
A "brand" is just: its own domain, its own design (colours/logo), its own
copy on 9 pages, and its own contact details. Nothing about bookings,
payments, the database, or `/admin` changes per brand — those are
deliberately shared, which is *why* this is one Vercel project and not a
separate one per brand.

## Step 1 — Register the config: `lib/brands.ts`

Add one entry to the `BRANDS` array with the brand's:
- `slug` (kebab-case, used in URLs internally, e.g. `"reading-removals"`)
- `domain` (the real domain, e.g. `"www.readingremovals.co.uk"`)
- `name`, `tagline`
- `phone` / `phoneHref` / `whatsappNumber` (E.164 digits, no `+`)
- `address` (real NAP — name/address/phone — matters for local SEO)
- `towns` (one town, or several if it's a multi-town brand like ManyVans)
- `emailFrom` / `emailAddress`
- `colors` (primary, primaryDark, accent, accentLight — pick something
  genuinely distinct from every other brand's palette, not a reskin)
- `allowBankTransfer: false` (Ample only, for now)
- `allowAutomatedSms: false` (Ample only, for now — new brands get
  WhatsApp queues but never automated SMS)

That's the ONLY file the booking engine, quote delivery, and WhatsApp
queue need touched — everything downstream reads from here.

## Step 2 — Design a logo: `components/shared/logos/<Brand>Logo.tsx`

Copy the shape of `ThatchamMoversLogo.tsx` / `NewburyRemovalsLogo.tsx` /
`ManyVansLogo.tsx` — a `{ className, variant }` prop signature (`variant`
is `"color" | "white"`), an inline SVG mark (no stock icons), and a
wordmark next to it using the brand's own two colours. Keep it genuinely
different in shape/concept from the existing marks, not just a recolour.

## Step 3 — Middleware already handles routing

`middleware.ts` resolves the brand from the `Host` header
(`brandForHost()` in `lib/brands.ts`) and rewrites these paths to
`/${brand.slug}${path}` for any non-Ample brand:
`/`, `/man-and-van`, `/house-clearance`, `/about`, `/contact`, `/tips`,
and anything under `/tips/`. **No changes needed here** unless a future
brand needs a genuinely different page set — if so, add the new path to
`BRAND_PAGE_PATHS` or `BRAND_PAGE_PREFIXES` in `middleware.ts`.

## Step 4 — Write the content: `lib/brand-page-content/<slug>.tsx`

This is the real writing work. Create one file exporting:
- `<slug>Removals`, `<slug>ManAndVan`, `<slug>HouseClearance` —
  `BrandPageContent` objects (see the type in `BrandPageShell.tsx`):
  hero copy, 3-4 trust points, a story section, a services grid, **at
  least 7-10 FAQs** (this matters for SEO and for actually answering what
  customers ask), and a `heroAction` component (CTA buttons for
  Removals/Man and Van, the `InstantHourlyQuoteWidget` for House
  Clearance).
- `<slug>About` — a `BrandAboutContent` object (see `BrandAboutPage.tsx`):
  h1, intro, 2-3 paragraphs of real story (who's behind it, why it
  exists — tie it honestly to the real experience behind the brand,
  don't fabricate years in business for a brand-new storefront), and 3
  "values" tiles.
- `<slug>Tips` — a `TipArticle[]` array (see `BrandTipsPages.tsx`): at
  least 2 genuinely useful articles answering real customer questions
  for that town specifically (not generic filler) — this is also where
  future daily blog posts get added (see "Daily blog posts" below).

Copy voice: direct-response, confident, no filler — match the existing
9+3 pages' tone. Every page needs real NAP (name/address/phone) baked
into the copy and into the JSON-LD (handled automatically by
`BrandPageShell`/`BrandChrome` from `lib/brands.ts`, no extra work here).

## Step 5 — Create the 12 route files under `app/(brands)/<slug>/`

All 12 are thin wrappers — copy an existing brand's files and swap the
imports/brand slug. The route group is `(brands)`, NOT `(public)` —
`(public)` wraps everything in Ample's own Navbar/Footer, which a
white-label brand must never show.

```
app/(brands)/<slug>/page.tsx                    → BrandPageShell + <slug>Removals
app/(brands)/<slug>/man-and-van/page.tsx        → BrandPageShell + <slug>ManAndVan
app/(brands)/<slug>/house-clearance/page.tsx    → BrandPageShell + <slug>HouseClearance
app/(brands)/<slug>/about/page.tsx              → BrandAboutPage + <slug>About
app/(brands)/<slug>/contact/page.tsx            → BrandContactPage
app/(brands)/<slug>/tips/page.tsx               → BrandTipsIndexPage + <slug>Tips
app/(brands)/<slug>/tips/[slug]/page.tsx        → BrandTipsArticlePage (dynamic, generateStaticParams from <slug>Tips)
```

(That's 7 listed, 2 of which — `/`, `/man-and-van`, `/house-clearance` —
are what's loosely called "the 9 pages" historically back when the first
3 brands only had 3 pages each; it's now 7 route files per brand.)

Every page's metadata uses `brandPageMetadata(brand, title, description,
path)` from `lib/brands.ts` — never hand-roll a `Metadata` object, it's
what stops the brand's `<title>`/OpenGraph tags from showing "Ample
Removals" (the root layout's own metadata defaults to Ample; this helper
overrides it per-page without needing `headers()`, which would force the
*entire site* out of static generation — see the lesson below).

## Step 6 — Domains (manual, cannot be scripted from here)

1. Vercel dashboard → the **ampleremovals** project → Settings → Domains
   → Add → the new domain (and its `www.` variant).
2. Vercel shows the exact DNS records needed. Add them at the registrar.
3. Resend dashboard (or API, if given a domain-management-scoped key) →
   add the brand's sending domain, verify SPF/DKIM/DMARC.
4. Nothing else — once DNS resolves, `brandForHost()` picks it up
   automatically and the brand's own homepage renders at `/`.

## Step 7 — Build, typecheck, verify, commit

```
npx tsc --noEmit   # compare error count to the pre-existing baseline (136 as of this writing)
rm -rf .next && npx next build   # must complete with only the pre-existing /opengraph-image error
```
Then spot-check the built HTML directly (`grep -o "Ample Removals"
.next/server/app/<slug>.html` should return nothing) before committing.
Brand pages render dynamically (see lesson 6 below), so after this build
there's no static `.html` to grep under the bare slug — use `next dev`
and `curl` the route instead to check rendered output (see lesson 6).

## Daily blog posts (future, once brands are live)

Each brand's `TipArticle[]` array in its content file IS the blog. To add
a new post for any brand: append a new `TipArticle` object to that
brand's array (slug, title, excerpt, readingTime, publishedAt, sections)
— it shows up on `/tips` and gets its own `/tips/<slug>` page
automatically via `generateStaticParams`, no other changes needed. A
future daily-reminder system (deferred — see Phase 9 in `todo.md`) would
write one article, framed differently per brand's own town/voice, into
all 4 (eventually more) brands' arrays on the same day.

## Lessons learned building the first 3 brands (read before repeating)

1. **Never put a brand page under `app/(public)/...`.** That route group
   wraps everything in Ample's Navbar/Footer. Brand pages live under
   `app/(brands)/...` — same URL path, since route groups don't affect
   routing, but zero inherited Ample chrome.
2. **Never make the root layout (`app/layout.tsx`) read `headers()`.**
   It's tempting to resolve the brand there for metadata/JSON-LD, but
   `headers()` forces that layout — and therefore the ENTIRE site, every
   page — out of static generation into per-request dynamic rendering.
   Caught this once already: a `next build` that silently stops emitting
   `.html` files anywhere is the sign. Fix: keep the root layout fully
   static (Ample's own defaults), move Ample's own JSON-LD down into
   `app/(public)/layout.tsx` (Ample-only, no `headers()` needed since
   it's already scoped to Ample's own routes by folder), and give every
   brand page its own `brandPageMetadata()` override instead.
3. **Never pass a component function as a prop into a "use client"
   component from a Server Component.** `logo={Logo}` breaks at build
   time with a cryptic minified `"X is not a function"` error — React
   Server Components can't serialize a bare function reference. Pass the
   *rendered element* instead: `logo={<Logo />}`.
4. **Never export a plain data function from a file with `"use client"`
   at the top, if a Server Component needs to call it directly.** Every
   export from a `"use client"` file becomes a client reference, even a
   function that returns a plain array. `standardBrandNavLinks()` had to
   move out of `BrandNavbar.tsx` into its own plain module
   (`brand-nav-links.ts`) for exactly this reason.
5. **Internal brand links (nav, footer, services grid, tips articles)
   must resolve correctly in TWO contexts**: once a brand's own domain is
   connected, plain root-relative links ("/", "/about") are exactly
   right — middleware's rewrite means the Host already matches the
   brand. But before DNS is pointed, the only way to preview a brand is
   by path on another domain (`ampleremovals.com/thatcham-movers`), where
   a plain `/about` link would resolve to THAT domain's own `/about`
   (a 404) instead of staying on the preview path. `brand-links.ts`
   (`resolveBrandBasePath` + `brandHref`) fixes this by checking the
   current request's resolved brand (via `getCurrentBrand()`, which
   reads the `x-brand` header middleware already sets from Host) against
   the page's own brand, and prefixing internal links only when they
   differ. Every component that renders an internal brand link
   (`BrandChrome`, `BrandPageShell`, `BrandTipsPages`) needs to call this
   — it's not optional for a new page type with its own internal links.
6. **This link-prefixing fix costs static generation for brand pages.**
   `resolveBrandBasePath()` calls `getCurrentBrand()`, which reads
   `headers()` — and `headers()` forces whatever uses it out of static
   prerendering into per-request dynamic rendering. Unlike lesson 2
   (which broke the ENTIRE site), this is scoped to just the brand pages
   themselves, which is an acceptable, deliberate trade: the two
   requirements (working preview-by-path links today, zero Ample
   linkage) are genuinely incompatible with a single static HTML file,
   since the same prerendered file can't contain different hrefs
   depending on which domain requested it. After a `next build`, these
   pages show up as `.js` only under `.next/server/app/(brands)/...`
   (no sibling `.html`) — that's expected, not a bug. Verify them with
   `next dev` + `curl` instead of grepping static output.
5. **Always verify with a real `next build`, not just `tsc --noEmit`.**
   All 4 bugs above passed typecheck cleanly — none of them are type
   errors, they're React Server Components runtime rules. A full build
   that actually prerenders every brand page is the only real proof.
