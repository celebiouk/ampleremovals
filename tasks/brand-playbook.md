# Multi-Brand Playbook — Adding a New Town Domain

This is the step-by-step recipe for adding another white-label brand (e.g.
`readingremovals.co.uk`, `didcotremovals.co.uk`, `abingdonremovals.co.uk`,
`basingstokemovers.co.uk`) on top of the same system that runs Ample
Removals, Thatcham Movers, Newbury Removals and ManyVans. Follow this in
order — each step points at the real file to copy/edit.

## What "a brand" actually is

One Next.js app, one Supabase database, one admin dashboard — all shared.
A "brand" is just: its own domain, its own design (colours/logo), its own
copy on marketing pages, and its own contact details. Nothing about the
booking engine, the database, or `/admin` changes per brand — those are
deliberately shared, which is *why* this is one Vercel project and not a
separate one per brand. **But the booking journey the customer actually
sees (the wizard, the deposit/payment page, the confirmation page, and
every email/SMS/WhatsApp message that comes out of it) must still look
and sound like the brand they booked with, start to finish — see "The
shared booking journey" below.** Adding a brand to `lib/brands.ts`
automatically covers this with zero extra work, as long as that brand's
colours/phone/email are filled in correctly — this is the entire point
of having built it this way.

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

## Step 2b — Design a theme: `components/local/multibrand/themes/<brand>/`

A brand's look is NOT a recolour of a shared template. Each brand gets its own
theme (header, footer, service-page body, inner-page hero, class tokens) plus
its own fonts, scoped to `app/(brands)/<slug>/layout.tsx` so other brands never
download them. Follow `SKILL2.md` (concept first, one signature device, a
distinct type pairing and layout skeleton) and register the theme in
`themes/registry.ts`. A brand with no registered theme falls back to the
original shared template, which works but looks like every other brand.
Existing themes to compare against: ManyVans (van livery), Thatcham Movers
(village noticeboard), Newbury Removals (racecourse enclosure).

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

## The shared booking journey (/booking, /quote, /confirmation)

This is the part a new brand gets **automatically** — nothing to build
per brand here, but it's worth understanding, since it's the part that
was wrong for the first 3 brands and had to be fixed after launch (the
"why does Get a free Quote lead to Ample's booking page" bug report).

**What it is**: `/booking/[service]` (the wizard), `/quote/[bookingId]/
[token]` (the deposit/payment page), and `/confirmation` live in their
own route group, `app/(shared-booking)/`, with their own layout
(`app/(shared-booking)/layout.tsx`). That layout resolves the current
brand via `getCurrentBrand()` and either renders Ample's own Navbar/
Footer unchanged (`brand.slug === "ample"`) or a lightweight brand header
(logo + phone, no distracting nav mid-booking) with the booking wizard's
colours re-themed to match.

**How the colour theming works**: the wizard's ~40 Tailwind
`brand-purple-*`/`brand-green-*` classes compile to fixed hex values at
build time — they can't vary per request on their own. `lib/brand-
theme.ts`'s `brandThemeCssVars(brand)` generates a CSS-variable version
of that same colour ramp from the brand's own `colors.primary`/
`primaryDark`/`accent`/`accentLight`, and `app/globals.css` has a block
of `[data-brand-theme] .bg-brand-purple-800 { ... !important }`-style
rules (one per exact utility class actually used in the journey) that
redirect to those variables. The layout sets `data-brand-theme` + the
variables on a wrapper div only for non-Ample brands, so Ample's own
flow is completely unaffected.

**Adding a new brand needs zero changes here** — the layout, the CSS
override rules, and the ramp generator are all brand-agnostic; they read
whatever `lib/brands.ts` says. The only way this breaks for a new brand
is if a *new* booking-wizard component introduces a `brand-purple-*` or
`brand-green-*` shade that isn't in the override list yet — if a new
wizard step looks unthemed (still purple/green on a non-Ample brand),
grep the component for `brand-(purple|green)-[0-9]+` and add any missing
shade to `app/globals.css`'s override block.

**Emails/SMS/WhatsApp from this journey**: `lib/notifications.ts`
resolves the brand from `payload.brand` (a slug stored on the booking
itself, not re-derived from the request) and uses `brand.name`/
`brand.phone`/`brand.emailFrom`+`brand.emailAddress` throughout —
including the HTML email template, which used to hardcode "Ample
Removals" and `#6b21a8` everywhere. SMS is still gated behind
`brand.allowAutomatedSms` (false for every brand except Ample, per the
existing policy). Any NEW code path that creates a booking must set
`brand: <resolved slug>` on the `NotificationPayload`/booking record, the
same way `lib/bookings/createBooking.ts` and `handleBookingRoute.ts`
already do — if that field is left out, the notification functions
default to Ample.

**Known gap, not yet fixed**: `app/api/booking/landing/route.ts` (the
paid-ad landing-page wizard, separate from the main `/booking` flow) does
not yet resolve or pass `brand` into its notification calls, so it will
default to Ample's branding regardless of which domain it's reached from.
Low priority today since no ad campaigns run for the new brands yet, but
fix it the same way before that changes.

## Disguising the wizard itself — why this exists

An explicit, deliberate requirement from the owner: a customer who gets
quotes from Ample, Thatcham Movers, Newbury Removals and ManyVans back to
back should never be able to tell they're the same company. Colour
theming alone doesn't achieve that — it's still visibly "the same form,
recoloured" to anyone paying attention. So three more things vary per
brand, on top of the colour theme:

1. **Step order and grouping.** Every brand's wizard collects the exact
   same fields into the exact same Zod schema (so the admin dashboard and
   the database are completely unaffected), but the *order* those
   questions are asked in genuinely differs. See `wizard-configs.tsx`:
   each service (`removals`, `man-and-van`, `house-clearance`) has one
   step dictionary (`id → {fields, element}`, identical for every brand)
   and one review-sections list (also identical, referenced by step
   `id` rather than a numeric index), plus a **separate order array per
   brand**. `buildSteps()` assembles the final `WizardStep[]` from
   whichever order is active and resolves each Review section's "Edit"
   link by looking up `order.indexOf(id)` — so reordering can never
   silently break an Edit link the way a hardcoded numeric `editStep`
   could. House Cleaning and End of Tenancy aren't brand-variant (no
   white-label brand offers them) and keep a single fixed order.
2. **Step titles and wording.** Each brand has its own title string per
   step id (see the `*Titles` maps in `wizard-configs.tsx`) — a different
   voice, not just the same sentence restructured. The booking page's
   intro sub-heading (`app/(shared-booking)/booking/[service]/page.tsx`)
   and the confirmation email/SMS/WhatsApp copy (`lib/notifications.ts`'s
   `BRAND_VOICE`, `lib/bookings/quoteDelivery.ts`'s `QUOTE_VOICE`) follow
   the same pattern — genuinely different sentences per brand, not the
   same template with the company name swapped in.
3. **The wizard shell itself.** `BookingWizard.tsx`'s `SHELL_VARIANTS`
   gives each brand a different progress indicator (a smooth percentage
   bar for Ample, a numbered-dot row for Thatcham Movers, a compact
   "X/Y" counter for Newbury Removals and ManyVans), different step-change
   animation (slide / fade / scale / vertical-slide), different card
   corner radius and border treatment, and different button wording
   ("Continue"/"Submit booking" vs "Keep Going"/"Show Me The Price" etc).
   Ample's entry reproduces the wizard's original look exactly, and the
   admin-side `CompletionFlow` never passes a `brandSlug` at all, so
   neither changes.

**Adding this for a future brand**: add one entry to each `*Orders`
map and each `*Titles` map in `wizard-configs.tsx` (for `removals`,
`man-and-van`, and `house-clearance` — or whichever services that brand
actually offers), one entry to `SHELL_VARIANTS` in `BookingWizard.tsx`,
and one entry each to `BRAND_VOICE` (`lib/notifications.ts`) and
`QUOTE_VOICE` (`lib/bookings/quoteDelivery.ts`). Falling back silently to
Ample's entries for an unlisted brand slug would defeat the entire point
— always add a real entry, never rely on the default.

**Verifying a reorder is safe before shipping it**: the one thing that
can silently break is a step id typo in an order array (a step that's in
the dictionary but missing from some brand's order, or listed twice).
Write a quick throwaway script that checks each brand's order array is
exactly a permutation of the dictionary's keys + `"review"`, and that
every review section's `editStepId` appears in that order — this caught
nothing wrong when the first 3 brands were built, but it's a 2-minute
check against a real mistake that `tsc`/`next build` cannot catch (the
types don't know what a *valid* order looks like, only a well-typed one).

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

## Ample Logistics — a different business line, NOT a removals brand

`amplelogistics.co.uk` is an HGV driver recruitment agency — a separate
business from removals, sharing only the same Vercel project, Supabase
database, and admin dashboard. It deliberately does **not** go through
`lib/brands.ts`'s `Brand`/`BRANDS` system: that system carries removals-
specific fields (`towns`, `allowBankTransfer`, the booking wizard's
`whatsappNumber`) that don't apply here, and Ample Logistics has its own
completely separate page set, forms, and database tables — bolting it
onto the removals `Brand` type would mean half the fields on every
`Brand` object meaning nothing for three-quarters of the `BRANDS` array.

**Architecture**:
- `lib/logistics.ts` — the brand's own constants (name, colours,
  Berkshire towns list, licence categories, status enums), parallel to
  but independent of `lib/brands.ts`.
- `middleware.ts` has a dedicated `amplelogistics.co.uk` branch, checked
  *before* the removals brand-rewrite logic, rewriting its 7 known paths
  (`/`, `/businesses`, `/drivers`, `/about`, `/contact`,
  `/privacy-notice`, `/terms`) to `/logistics/*`. Adding an 8th page
  means adding its path to `LOGISTICS_PAGE_PATHS` in `middleware.ts` —
  forgetting this is exactly the kind of mistake that 404s silently on
  the live domain while working fine on localhost (no host check there).
- `app/(logistics)/` — its own route group, own layout
  (`LogisticsHeader`/`LogisticsFooter` in `components/logistics/
  LogisticsChrome.tsx`), no shared chrome with removals or any white-
  label brand.
- Two new tables, `logistics_driver_requests` and
  `logistics_driver_applications` (migration:
  `supabase/migrations/add_ample_logistics.sql`), completely separate
  from the `bookings` table/`ServiceType` — public-insert-only + admin-
  full-access RLS, the same pattern as every other public-facing table.
  A private `logistics-cvs` storage bucket holds uploaded CVs
  (`lib/storage.ts`'s `uploadLogisticsCV`/`getLogisticsCVSignedURL`).
- Admin: a new "AMPLE LOGISTICS" nav group in
  `components/admin/AdminShell.tsx`'s `NAV_GROUPS`, with list+detail
  pages under `app/(admin)/admin/logistics/`. Unlike the removals
  `bookings` list page (which fetches via the browser Supabase client,
  relying on `FOR ALL TO authenticated` RLS), these fetch through proper
  `requireAdmin()`-gated API routes (`app/api/admin/logistics/*`) — this
  data is applicant PII, and the existing `authenticated USING (true)`
  RLS pattern would let *any* logged-in user (including a driver's
  mobile-app login, which is also `authenticated`) read it directly,
  not just admin staff. Follow this stricter pattern for any future
  table holding this kind of sensitive data, rather than the bookings
  list page's looser one.
- Email notifications (`lib/logistics-notifications.ts`) go to
  `daniel@ampleremovals.com` from `hello@amplelogistics.co.uk`, reusing
  the existing `sendEmail()` helper in `lib/resend.ts` — same Resend
  account, no new API key needed.

**The one thing that needs doing outside the code, before this actually
sends email**: `amplelogistics.co.uk` must be added and verified as a
sending domain in the Resend dashboard (Settings → Domains →
SPF/DKIM/DMARC records at the registrar). This was confirmed NOT done
yet by actually submitting a live test request and reading back
`server_logs`: `"The amplelogistics.co.uk domain is not verified."`
Until that's done, every submission still saves correctly (the
non-negotiable requirement), the failure is logged, and the visitor
still gets their confirmation — only the owner's email notification
silently fails, exactly as intended for a best-effort send. Don't
re-attempt this with the current `RESEND_API_KEY` — it's scoped
send-only and returns 401 on any domain-management call, confirmed
earlier for the other 3 brands' domains too.

**Lesson repeated from the removals brands, because it happened again
here too**: `sendEmail()`/`resend.emails.send()` returns `{ data, error
}` — it does **not** throw on a rejected send. The first version of
`lib/logistics-notifications.ts` only had a `try/catch` around the call
and never checked `error`, so the Resend rejection above was completely
silent — no log, nothing. Caught only by actually submitting a real
test request end-to-end and checking `server_logs` afterward, not by
reading the code. Always destructure and check `{ error }` explicitly,
the same way `lib/notifications.ts` already does.
