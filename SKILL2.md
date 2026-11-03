---
name: web-brand-design
description: Senior-designer method for designing distinctive, conversion-focused marketing websites for local service businesses (removals, logistics, trades). Use when designing or redesigning a brand website, landing page or multi-brand site family in Next.js + Tailwind. Covers concept, typography, colour, layout, motion, copy-honesty, accessibility, performance and visual verification.
---

# Web Brand Design — the senior-designer method

You are designing for a real business whose customers are stressed, busy and on a phone.
A beautiful site that does not get the phone call, WhatsApp or quote click has failed.
A generic site that could belong to any competitor has also failed. Do both jobs.

## 1. Concept before pixels (do this in writing, 5 lines max per site)

1. **Who lands here, and what is their mood?** (Moving house in a week? A haulier short of a driver at 6am?)
2. **One-sentence concept.** A physical, specific metaphor, not an adjective. "A village noticeboard", "a racecourse
   members' enclosure", "livery on the side of a van", "a despatch board". If the concept cannot be drawn, it is not a concept.
3. **The one memorable thing.** Pick ONE signature device (a giant numeral, a route line, a stripe system, a plate badge)
   and repeat it with discipline. Everything else stays quiet.
4. **Tone, on a dial.** Warm <-> cold, loud <-> calm, playful <-> authoritative, dense <-> airy. Commit to a position on each.
5. **What it must NOT look like.** Name the nearest competitor/template and move away from it.

A site family (several brands on one codebase) must read as DIFFERENT companies: different concept, type pairing,
layout skeleton, background mode and motion personality. Recolouring one template is not a redesign.

## 2. Typography (the fastest way to look expensive or cheap)

- One characterful **display** face + one calm **text** face. Two families, maximum three with a mono for data.
- Never default to Inter, Roboto, Arial, system-ui or Space Grotesk. Do not reuse the same pairing across brands.
- Display type is a design element: scale it boldly (clamp 2.75rem to 7rem on heroes), tighten leading (0.9-1.05),
  tighten tracking on caps-free large type, add tracking (+0.12em) on small caps labels.
- Body: 16-18px, line-height 1.6-1.7, measure 60-72ch. Never grey-on-grey; body text contrast >= 4.5:1.
- Use `next/font/google` with `display: "swap"`, only the weights actually used, scoped to the brand's layout so other
  brands never download it. Use CSS variables so Tailwind `font-display` keeps working.
- Numerals matter in a pricing/quote business: use tabular figures for prices, phone numbers and times.

## 3. Colour

- Brand palette is a constraint, not a limit. Build a system: **ground** (page), **ink** (text), **brand** (dominant),
  **signal** (one sharp accent for CTAs only), **tint** (soft surface). 60/30/10 weighting. Dominant + sharp accent
  beats an even spread.
- Define tokens as CSS variables on the brand wrapper. Never hard-code hex in components.
- Avoid: purple gradient on white, blue-to-teal SaaS gradients, glassy cards on pastel blobs, grey cards with a
  coloured icon in a circle. Atmosphere comes from texture, grain, pattern, photography crops, tinted shadows.
- Contrast: CTA text on CTA colour >= 4.5:1; check the accent colour on the dark ground, it often fails.
- Support one mode well (light OR dark per brand) rather than two modes badly.

## 4. Layout and composition

- Pick a skeleton per brand and break the grid once, on purpose: an overlapping badge, an oversized numeral bleeding
  off the edge, a full-bleed band, a diagonal cut, a sticky side column, asymmetry (7/5 or 8/4 splits).
- Vary section rhythm: tall, short, tall. Alternate dense and airy. Never five identical "heading + 3 cards" bands.
- Cards are a last resort. Prefer rules, numbered rows, tables, ledgers, pull-quotes, big-number stat strips.
- Spacing scale: 4/8/12/16/24/32/48/72/112. Section padding py-16 mobile, py-28 desktop. Consistent gutters (px-5 mobile).
- Hierarchy test: squint at the page; the order your eye travels must be headline, proof, primary action.

## 5. Conversion rules (non-negotiable for service businesses)

- Primary action visible without scrolling at 375px: quote button + tap-to-call + WhatsApp.
- Repeat the action after each proof block; never leave a section without a next step.
- Sticky bottom action bar on mobile; keep thumb-reachable targets >= 44x44px.
- Proof before pitch: insurance, fixed price, local address, years of experience, but ONLY facts that already exist in
  the content/config. Never invent reviews, counts, awards, founding years, ratings or logos.
- Keep every existing tracking call (`trackQuoteClick`, `trackPhoneClick`, page-view/attribution) and every CTA href.

## 6. Motion

- One orchestrated entrance (staggered reveal, 60-90ms steps, 500-700ms ease-out) beats scattered hover tricks.
- Scroll reveals via Framer Motion `whileInView` with `once: true`, translateY <= 24px. Animate transform and opacity only.
- A signature micro-interaction per brand (a van that drives across, a stripe that wipes, a number that counts) kept subtle.
- Always honour `prefers-reduced-motion`: disable transforms/loops, keep content visible.
- Never gate content behind animation: server-render content at full opacity, enhance on the client.

## 7. Imagery and graphics

- No stock-photo clichés and no fake photography. Use SVG illustration, pattern, typography and the real logo.
- Inline SVG for marks, route lines, stripes, map motifs; keep them `aria-hidden` and under ~3KB each.
- If photography is added later, plan crops, duotone/tint treatment and `next/image` sizes up front.

## 8. Accessibility and performance (part of design, not a final pass)

- Semantic landmarks: one `h1`, ordered headings, `header/nav/main/footer`, visible focus rings in the brand signal colour.
- Links look like links; icon-only buttons have `aria-label`; `details/summary` for FAQs is fine and keyboard-friendly.
- Contrast and 200% zoom must still work; no horizontal scroll at 375px.
- Fonts: preload only the display face weights above the fold. Avoid layout shift: reserve space for hero art.
- Keep JSON-LD, metadata, canonical URLs and headings intact when redesigning. A redesign must never cost SEO.

## 9. Verification loop (mandatory, never "done" without it)

1. Run the dev server, screenshot every changed page at 375x812 AND 1440x900 (full page).
2. LOOK at the screenshots. Check: hierarchy, overflow, truncation, contrast, CTA visibility, empty states.
3. Compare the brands side by side: if two of them could be mistaken for each other, redo one.
4. Run `tsc` and `eslint` on touched files; fix what you introduced.
5. Test the booking links and tel:/WhatsApp hrefs still resolve.

## 10. Anti-pattern checklist (fail the design if any is true)

- Looks like a template with a different colour. - Hero is centred gradient + two buttons + four pill badges.
- Uniform rounded-2xl white cards with an icon-in-circle. - Every section has the same padding and heading style.
- Stock font stack. - Decorative motion that delays reading. - Any invented fact or number.
- Brand A's name, phone or colour leaking onto Brand B's site.
