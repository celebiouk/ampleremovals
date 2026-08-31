## Task: Quote pricing — −15% items, total-only customer view, admin suggested-quote + tier

### Plan
**1. Reduce per-item moving prices by 15%** (base call-out & distance unchanged)
- [ ] Update the 81 rows in `item_prices` (price → round(price × 0.85))
- [ ] Update `DEFAULT_ITEM_PRICES` + `DEFAULT_CUSTOM_ITEM_PRICE` in `lib/pricing-defaults.ts` to match (keep code = DB)

**2. Customer sees only the total** (not the base + per-item breakdown)
- [ ] On `/quote/[bookingId]/[token]` Standard card: replace the priced line-by-line list with the "what's included" feature list + a single Total (mirrors Premium). No per-line prices, no ✕ toggles.
- [ ] Backend unaffected (reserve still recomputes from stored lines; removedKeys just stays empty).

**3. Admin "fill it for them" sees the system-suggested quote (Standard + Premium) while filling**
- [ ] New `POST /api/admin/quote/preview` — admin-only; takes the wizard's current values (bedrooms, inventory, add-ons, origin/destination postcodes) → returns `{ standardTotal, premiumTotal, deposit }` using the same pricing engine.
- [ ] Review step (admin mode): live "Suggested quote" panel showing Standard & Premium totals as the client would see them; a tier selector (Standard/Premium); keep the manual fee box — whatever admin types is THE fee; "use" buttons to copy a suggested total into the box.
- [ ] Pass `adminTier` through submit → `/api/admin/leads/complete` → `completeLead` (store tier, apply premium inclusions + label when premium, record in activity_log).

### Review
- **Item prices −15%:** updated all 81 `item_prices` rows (round(price×0.85), whole-pound) AND `DEFAULT_ITEM_PRICES`/`DEFAULT_CUSTOM_ITEM_PRICE` in code to the exact same values. Verified DB == code (81/81, 0 mismatches). Base call-out (£120), free miles (15) and per-mile (£1.50) unchanged. e.g. sofa 45→38, piano 120→102, wardrobe 35→30.
- **Customer sees only the total:** the Standard card no longer lists per-line prices (base, items, distance, add-ons) — it now shows the "what's included" list + one Total, mirroring Premium. Removed the ✕ line-toggles (a customer editing individual priced lines contradicted "only the total"). Backend reserve flow untouched — it recomputes from the stored line items server-side; removedKeys is simply always empty now.
- **Admin suggested quote + tier:** new admin-only `POST /api/admin/quote/preview` returns the same Standard & Premium totals the customer would get, from the live wizard values. The Review step (admin mode only) shows this as guidance with "Use this price" buttons, a Standard/Premium package selector, and the manual fee box (unchanged behaviour: whatever they type is the charge). `adminTier` flows to `completeLead`: Premium relabels the quote line, bundles packing/materials/dismantle/assemble, and — if the fee is left blank — defaults to the Premium multiple. Tier recorded in activity_log.
- **Watch out for:** whole-pound rounding means the effective discount per item is ~15% (not exact to the penny). Re-seeding pricing from code defaults stays consistent (both reduced). Pre-existing repo-wide `tsc` errors are unrelated (build has `ignoreBuildErrors`); all touched files typecheck & lint clean.
