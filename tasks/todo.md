## Task: Per-address access questions + full "everything you supplied" emails

### Plan
**A. Wizard — ask access right after EACH address**
- [ ] Schema: add dest access fields (`destFloor`, `destHasLift`, `destParkingWithin20m`, `destAccessNotes`). Origin keeps existing `floor`/`hasLift`/`parkingWithin20m`/`specialInstructions`.
- [ ] `AccessStep` → parameterised (title/subtitle + field names) so it serves both addresses.
- [ ] Removals steps reorder: removalType → originAddress → **originAccess** → property → destAddress → **destAccess** → inventory → extras → description → date → cleaning → contact → review. Fix all editStep indices; add Pickup/Drop-off access review sections.

**B. Persist**
- [ ] DB: add `dest_floor`, `dest_has_lift`, `dest_parking_within_20m`, `dest_access_notes` to `bookings`.
- [ ] `createBooking` + `completeLead`: write dest access (best-effort block, alongside origin).

**C. Driver app (must see both so they can challenge discrepancies)**
- [ ] `driver-app/lib/types.ts`: add dest access fields.
- [ ] Job screen: relabel Access → "Pickup access"; add "Drop-off access" card (floor/lift/parking + notes).
- [ ] EAS build → TestFlight.

**D. Emails — everything the customer supplied**
- [ ] New `lib/booking-summary-email.ts`: reusable full summary (both addresses + access, property, inventory, extras, description, date, contact, quote).
- [ ] On submit (removals): email the summary to the customer immediately.
- [ ] 3-day cron: append the same full summary to the existing 3-days-before email.

### Review
- **Wizard:** `AccessStep` parameterised; removals now has an `originAccess` step (right after the pickup address) and a `destAccess` step (right after the drop-off address) — 13 steps. Review page shows Pickup access + Drop-off access sections; all editStep indices updated.
- **Data:** added `dest_floor/dest_has_lift/dest_parking_within_20m/dest_access_notes` to `bookings`; written from both `createBooking` (customer submit) and `completeLead` (admin fill). Origin access still maps to the existing floor/has_lift/parking_within_20m/special_instructions columns (no consumer broke).
- **Driver app:** separate "Pickup access" and "Drop-off access" cards (floor/lift/parking + notes) via a shared `AccessCard`; general description stays in "Job notes". Needs the TestFlight build to reach devices.
- **Emails:** new `lib/booking-summary-email.ts` renders everything supplied (both addresses + access, property, items, extras, description, date, contact, quote). Sent immediately on customer removals submit, and appended in the 3-day cron (removals only). Admin-completed leads get it via the 3-day cron.
- **Watch out for:** all changes are removals-only (the flow with two addresses). Man&van etc keep their existing single flow. Web deploys via push; driver app requires the EAS build. Pre-existing repo-wide tsc errors are unrelated (build has ignoreBuildErrors); all touched files typecheck clean (web + driver-app).
