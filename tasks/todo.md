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
(to be filled in on completion)
