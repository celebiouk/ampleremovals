## Task: Multi-Brand White-Label System (Newbury Removals, ManyVans, Thatcham Movers)

### What this is
One shared app, one shared Supabase database, one shared admin backend and
booking pipeline — but three additional public-facing "storefronts" that look
and feel like entirely separate companies to a customer: their own domain,
their own fully distinct design, their own name/logo/contact details, and
emails that arrive "from" that brand. Every lead, regardless of which domain
it came through, lands in the same admin system you already use, tagged with
which brand it came from.

Confirmed scope (your answers):
- DNS is at a non-Cloudflare registrar → I hand you exact records to paste in
  yourself for each domain; I can't script that part.
- Each of the 3 new brands gets a **fully distinct design**, not a reskin —
  same bar as the Newbury/Thatcham flagship pages.
- manyvans.com covers the full service range (removals, man and van, house
  clearance, rubbish removal, end of tenancy), not just man-and-van jobs.
- Email: brand-specific "from" name/address on every brand.
- WhatsApp: brand-specific wording, but still queue-only (admin sends
  manually) — no change to that existing behaviour, just correct branding in
  the queued text.
- SMS: **only Ample Removals sends automated SMS.** The 3 new brands never
  trigger an SMS send at all — not even with their own branding.

### Plan
- [ ] **Phase 1 — Data model & brand foundation**
  - [ ] `brands` table: slug, domain, display_name, tagline, logo, colour
        tokens, company_phone, company_email (the real "from" address),
        resend_from, founded/story copy, socials.
  - [ ] Seed it with `ample` (existing identity) + 3 new rows for Newbury
        Removals, ManyVans, Thatcham Movers (placeholder copy/branding until
        Phase 5 content is written).
  - [ ] `bookings.brand_id` (nullable FK, defaults to `ample` for every
        existing row — zero impact on current data).
- [ ] **Phase 2 — Domains & host-based routing**
  - [ ] Add all 3 domains to this Vercel project (`vercel domains add`) —
        I can do this part. You'll get back exact DNS records (A/CNAME) to
        add at your registrar for each domain — I'll hand you those exactly.
  - [ ] Next.js middleware resolves `brand` from the request's `host` header
        on every request, makes it available to layouts/pages.
- [ ] **Phase 3 — Branded email sending**
  - [ ] Verify each of the 3 domains as a sending domain in Resend (SPF/DKIM/
        DMARC) — I can create the domain resource via the Resend API and
        fetch the required records, but adding those records at your
        registrar is the same "you" step as Phase 2's DNS.
  - [ ] Swap every hardcoded `resendFrom`/"Ample Removals" string across the
        notification code (quoteDelivery.ts, notifications.ts,
        followups/content.ts, confirmation/receipt emails, etc.) for a
        brand-resolved name + address, driven by the booking's `brand_id`.
- [ ] **Phase 4 — SMS/WhatsApp brand gating**
  - [ ] `sendSMS()` call sites: no-op unless the booking's brand is `ample`.
  - [ ] WhatsApp queue content (title + message body) uses the correct brand
        name/phone per booking — still queue-only, no behaviour change to
        the manual-send flow itself.
- [ ] **Phase 5 — Three fully distinct brand designs**
  - [ ] One real design pass per brand (name confirmation if needed, logo,
        colour palette, typography, hero/voice) — same craft level as the
        Newbury/Thatcham flagship pages, not templated.
  - [ ] Each brand gets its own homepage, service pages and booking entry
        points, all driven by the **same shared booking wizard/payment/admin
        backend** underneath.
  - [ ] Needs your input per brand before I design: any existing logo/brand
        assets, or starting from nothing; any name/tagline preference beyond
        the domain name itself.
- [ ] **Phase 6 — Admin brand visibility**
  - [ ] Brand filter across bookings/leads/reports ("All brands" / Ample /
        Newbury Removals / ManyVans / Thatcham Movers).
  - [ ] `/admin` works identically on all 4 domains (same login, same data)
        — defaults to that domain's brand when you're on a branded domain,
        always lets you switch to "All brands" or any other brand from
        there, including from ampleremovals.com.

### Confirmed brand specs (from owner, 2026-11-01)

**Thatcham Movers** — thatchammovers.co.uk
- Address: 17 Thatcham Broadway, RG19 3HX
- Phone: 07958623678 (temporary)
- Coverage: Thatcham only
- Pages: Removals in Thatcham (main/home), Man and Van in Thatcham, House Clearance in Thatcham

**Newbury Removals** — newburyremovals.co.uk
- Address: 4 Market Place, Newbury, RG14 5BD
- Phone: 0333 577 2070 (same as Ample, temporary)
- Coverage: Newbury only
- Pages: Removals in Newbury (main/home), Man and Van in Newbury, House Clearance in Newbury

**ManyVans** — manyvans.com
- Address: 20 Market Street, Newbury, RG14 5DP
- Phone: 0333 577 2070 (same as Ample, temporary)
- Coverage: Newbury AND Thatcham (both towns)
- Pages: Removals covering Newbury & Thatcham (main/home), Man and Van (Newbury & Thatcham), House Clearance (Newbury & Thatcham)

**Payments (all 3 new brands):** card via Stripe only, Klarna promoted prominently. No bank transfer — that stays Ample-only.

**WhatsApp:** every brand's queued messages need a visible brand label/badge in admin so the owner never sends a ManyVans lead's message from the Ample WhatsApp number by mistake.

**More brands coming later** (readingremovals.co.uk, didcotremovals.co.uk, abingdonremovals.co.uk, basingstokemovers.co.uk, etc.) — the brand system must be config-driven, not three one-off hardcoded sites, so adding #5 is cheap.

### Phase 7 — Three logos
- [ ] Design a distinct SVG mark + wordmark per brand (no stock icons/fake
      photography) — genuinely different palette and feel from Ample and
      from each other.

### Phase 8 — The 9 new pages
- [ ] 3 pages per brand (main Removals + Man and Van + House Clearance),
      each with its own copy — not reworded templates — written at the same
      direct-response + modern-SEO bar as the Newbury/Thatcham Ample pages.
- [ ] Real NAP (name/address/phone) + LocalBusiness JSON-LD per brand, using
      the confirmed addresses/phones above.

### Phase 9 — Blog + daily content-reminder system (DEFERRED)
Not started this round — sequenced after Phases 1-8 are live, since a blog
needs real sites to attach to first. Scope for when we get there:
- [ ] A real blog-post content model (DB-backed, not hardcoded pages) with
      brand + service-topic tagging.
- [ ] A daily cron that rotates topic = Removals -> Man and Van -> House
      Clearance -> repeat, and emails the owner a ready-to-paste prompt.
- [ ] When that prompt is pasted into a conversation: research the topic,
      write one strong post, and publish it to all 4 live brands that day
      (Ample, Thatcham Movers, Newbury Removals, ManyVans), each framed for
      that brand's own area/voice.
- [ ] Designed to extend cleanly to future brands as they're added.

### Review
(Filled in as each phase ships below.)
