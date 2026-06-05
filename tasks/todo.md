## Task: Phase 2 — Public multi-step booking wizard (all 5 services)

### Architecture
- Config-driven generic `BookingWizard` shell + per-service step lists.
- React Hook Form + Zod (per-step `trigger` validation), Framer Motion slide
  transitions (AnimatePresence mode="wait"), StepIndicator progress.
- Wizard context carries fetched postcode addresses + goToStep between steps.
- Real (minimal) submission API so the flow works end-to-end (Phase 3 adds
  email/SMS/logging).

### Plan
- [ ] lib/schemas/booking.ts — Zod schemas + types for all 5 services
- [ ] hooks/usePostcodeLookup.ts — cache last result
- [ ] hooks/useBookingForm.ts — RHF+Zod orchestration, submit, step nav
- [ ] Booking primitives: SelectableCard, OptionChip, FieldError, DateField
- [ ] WizardContext + BookingWizard shell (indicator, transitions, buttons, mobile bar)
- [ ] Shared steps: Postcode, AddressSelect, PropertyDetails, AdditionalServices,
      Description, MoveDate, ContactDetails, Review
- [ ] Service-specific steps: RemovalType, VanType, ClearanceType, ItemsOfNote,
      CleaningType, Frequency, CleaningDateTime, AddOns, AccessInstructions, SingleDate
- [ ] Wizard registry (slug → steps + schema + defaults + apiPath + serviceType)
- [ ] /booking/[service] page → renders the right wizard (+ prefill ?postcode)
- [ ] Confirmation page — animated SVG check, reference, next steps
- [ ] API routes (5) — Zod validate + persist + return {success, reference}
- [ ] createBooking helper (customer/address/booking/details/history inserts)
- [ ] Navbar active-service highlight
- [ ] tsc --noEmit clean + build + dev smoke test (375px & 1280px, valid/invalid postcode)
- [ ] Commit: "feat: multi-step booking wizard for all 5 services"

### Review
(to fill in on completion)
