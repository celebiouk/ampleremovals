## Task: World-class homepage redesign

### Aesthetic direction
Editorial / architectural. Dark aubergine atmosphere, film-grain texture, layered
mesh gradients, massive Syne display type, sharp green accents, asymmetric
grid-breaking composition. Premium, confident, memorable — next to comparemymove,
not below it. Avoid the "AI-slop purple-gradient-on-white" cliché by going dark and
textured in the hero and keeping white sections airy and intentional.

### Plan
- [ ] Add texture/util layers to globals.css (grain, mesh, gradient-text, marquee)
- [ ] Rebuild decorative hero SVG → architectural isometric crate composition
- [ ] Redesign Navbar for dark-hero context (refined, tactile CTA)
- [ ] Rewrite homepage: atmospheric hero (parallax + staggered entrance),
      glassmorphism services (grid-breaking offsets), how-it-works with ghost
      numbers + animated path, trust band, why-us, final CTA
- [ ] Framer Motion: staggered load (0.15s), whileInView reveals, hero parallax
- [ ] Verify build + dev smoke test (no errors, 200s)
- [ ] Commit: "style: world-class homepage redesign"

### Review
Done. Rebuilt the homepage to a premium, editorial standard:
- Hero: full-viewport aubergine **mesh gradient + film-grain**, **parallax** background
  & artwork (useScroll/useTransform), Syne headline at `clamp(3rem,8.5vw,8rem)`,
  staggered 0.15s entrance, tactile CTAs, architectural isometric-crate SVG, and a
  glass **stats bar that overlaps** the hero/services boundary (grid-breaking tension).
- Services: **glassmorphism** cards on lavender with vertical **offsets**, gradient
  icon tiles, hover lift+glow+rotate, whileInView stagger.
- How it works: **oversized ghost numbers** + **animated dashed connecting path**.
- Areas **marquee**, dark **mesh+grain trust band** with glass cards, final gradient CTA.
- Navbar refined (transparent→frosted, tactile pill CTA). New util layers in globals.css
  (mesh-aubergine, grain, glass, gradient text, marquee).

Verified: `npm run build` clean (23 routes); dev server 200; all new markers render.

Watch out: brand is locked to purple/green (CLAUDE.md). Avoided the "AI-slop purple-on-
white" cliché by going dark/textured in atmospheric sections and keeping white airy.

### Note
Repo had no git history/remote and `gh` is not installed — committed locally with the
requested message. Pushing needs a GitHub remote (see summary).
