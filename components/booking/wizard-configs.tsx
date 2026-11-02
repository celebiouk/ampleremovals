import type { ReactNode } from "react";
import type { DefaultValues, FieldValues } from "react-hook-form";
import type { WizardConfig, WizardStep } from "@/components/booking/types";
import { SERVICE_SCHEMAS } from "@/lib/schemas/booking";
import { AddressStep } from "@/components/booking/steps/AddressStep";
import { PropertyDetailsStep } from "@/components/booking/steps/PropertyDetailsStep";
import { AdditionalServicesStep } from "@/components/booking/steps/AdditionalServicesStep";
import { ExtraHelpStep } from "@/components/booking/steps/ExtraHelpStep";
import { InventoryStep } from "@/components/booking/steps/InventoryStep";
import { HoursNeededStep } from "@/components/booking/steps/HoursNeededStep";
import { AccessStep } from "@/components/booking/steps/AccessStep";
import { CleaningUpsellStep } from "@/components/booking/steps/CleaningUpsellStep";
import { DescriptionStep } from "@/components/booking/steps/DescriptionStep";
import { MoveDateStep } from "@/components/booking/steps/MoveDateStep";
import { ContactDetailsStep } from "@/components/booking/steps/ContactDetailsStep";
import { ReviewStep, type ReviewSection } from "@/components/booking/steps/ReviewStep";
import {
  RemovalTypeStep,
  VanTypeStep,
  ClearanceTypeStep,
  CleaningTypeStep,
  FrequencyStep,
} from "@/components/booking/steps/choice-steps";
import {
  ItemsOfNoteStep,
  AddOnsStep,
  AccessInstructionsStep,
  CleaningDateTimeStep,
  SingleDateStep,
} from "@/components/booking/steps/extra-steps";

/**
 * Brand-aware wizard step order/wording — see tasks/brand-playbook.md,
 * "The booking wizard itself" for the full explanation of why this exists
 * and how to extend it to a future brand. Short version: every brand
 * collects the exact same fields into the exact same schema (so the admin
 * dashboard is identical regardless of brand), but the ORDER those
 * questions are asked in, and the wording of each step's title, differs
 * per brand — on purpose, so a customer comparing Ample/Thatcham
 * Movers/Newbury Removals/ManyVans side by side never sees two identical
 * forms. House Cleaning and End of Tenancy aren't brand-variant (no
 * white-label brand offers them today) and keep their original single
 * order/wording regardless of brandSlug.
 */
export type BrandSlug = "ample" | "thatcham-movers" | "newbury-removals" | "manyvans";

const NO_EXTRAS = {
  packing_services: false,
  packing_materials: false,
  disassemble_furniture: false,
  assemble_furniture: false,
};

const contactRows = [
  { label: "Name", key: "fullName" },
  { label: "Email", key: "email" },
  { label: "Phone", key: "phone" },
];

const dateRows = [
  { label: "Preferred date", key: "moveDate" },
  { label: "Flexible from", key: "flexibleDateFrom" },
  { label: "Flexible to", key: "flexibleDateTo" },
];

/* Helper to build a step. */
const step = (
  id: string,
  title: string,
  fields: string[],
  element: ReactNode
): WizardStep => ({ id, title, fields, element });

const reviewStep = (sections: ReviewSection[]): WizardStep =>
  step("review", "Review", ["confirmed"], <ReviewStep sections={sections} />);

type Builder = (initialPostcode: string) => WizardConfig<FieldValues>;

/** One step's field list + rendered element — identical across every
 *  brand variant of a service, since the DATA collected never changes. */
interface StepDef {
  fields: string[];
  element: ReactNode;
}

/** A Review section definition keyed by step id rather than a numeric
 *  index — `buildSteps` resolves the real index from whichever brand's
 *  order array is active, so "Edit" links can never drift out of sync
 *  with a reordered wizard the way a hardcoded number could. */
interface ReviewSectionDef {
  title: string;
  editStepId: string;
  rows: { label: string; key: string }[];
}

function buildSteps(
  order: string[],
  dict: Record<string, StepDef>,
  titles: Record<string, string>,
  reviewSections: ReviewSectionDef[]
): WizardStep[] {
  return order.map((id) => {
    if (id === "review") {
      const sections: ReviewSection[] = reviewSections.map((s) => ({
        title: s.title,
        editStep: order.indexOf(s.editStepId),
        rows: s.rows,
      }));
      return reviewStep(sections);
    }
    const def = dict[id];
    return step(id, titles[id] ?? id, def.fields, def.element);
  });
}

/* ════════════════════════════════════════════════════════════════════
   REMOVALS (13 steps)
   ════════════════════════════════════════════════════════════════════ */

const removalsDict: Record<string, StepDef> = {
  removalType: { fields: ["removalType"], element: <RemovalTypeStep /> },
  originAddress: { fields: ["originPostcode", "originAddress"], element: <AddressStep label="What is your current address?" postcodeField="originPostcode" addressField="originAddress" /> },
  originAccess: { fields: [], element: <AccessStep title="Access at your current address" subtitle="Getting in & out where you're moving FROM. All optional — it helps our crew plan." /> },
  property: { fields: ["propertyType", "bedrooms"], element: <PropertyDetailsStep showBedrooms /> },
  destAddress: { fields: ["destinationPostcode", "destinationAddress"], element: <AddressStep label="What is the address you are moving to?" postcodeField="destinationPostcode" addressField="destinationAddress" /> },
  destAccess: { fields: [], element: <AccessStep title="Access at the address you're moving to" subtitle="Getting in & out where you're moving TO. All optional — it helps our crew plan." floorField="destFloor" liftField="destHasLift" parkingField="destParkingWithin20m" notesField="destAccessNotes" /> },
  inventory: { fields: [], element: <InventoryStep /> },
  extras: { fields: [], element: <ExtraHelpStep /> },
  description: { fields: ["description"], element: <DescriptionStep /> },
  date: { fields: ["isFlexibleDate", "moveDate", "flexibleDateFrom", "flexibleDateTo"], element: <MoveDateStep /> },
  "cleaning-offer": { fields: [], element: <CleaningUpsellStep /> },
  contact: { fields: ["fullName", "email", "phone"], element: <ContactDetailsStep /> },
};

const removalsReviewSections: ReviewSectionDef[] = [
  { title: "Removal", editStepId: "removalType", rows: [{ label: "Type", key: "removalType" }] },
  { title: "From", editStepId: "originAddress", rows: [{ label: "Address", key: "originAddress" }] },
  { title: "Pickup access", editStepId: "originAccess", rows: [{ label: "Floor", key: "floor" }, { label: "Lift", key: "hasLift" }, { label: "Parking ≤20m", key: "parkingWithin20m" }, { label: "Notes", key: "specialInstructions" }] },
  { title: "Property", editStepId: "property", rows: [{ label: "Type", key: "propertyType" }, { label: "Bedrooms", key: "bedrooms" }] },
  { title: "To", editStepId: "destAddress", rows: [{ label: "Address", key: "destinationAddress" }] },
  { title: "Drop-off access", editStepId: "destAccess", rows: [{ label: "Floor", key: "destFloor" }, { label: "Lift", key: "destHasLift" }, { label: "Parking ≤20m", key: "destParkingWithin20m" }, { label: "Notes", key: "destAccessNotes" }] },
  { title: "Items", editStepId: "inventory", rows: [{ label: "Items", key: "inventory" }] },
  { title: "Extra help", editStepId: "extras", rows: [{ label: "Services", key: "additionalServices" }, { label: "Packing", key: "packingHours" }, { label: "Dismantle", key: "dismantleCount" }, { label: "Assemble", key: "assembleCount" }] },
  { title: "About", editStepId: "description", rows: [{ label: "Description", key: "description" }] },
  { title: "Date", editStepId: "date", rows: dateRows },
  { title: "Contact", editStepId: "contact", rows: contactRows },
];

const removalsOrders: Record<BrandSlug, string[]> = {
  ample: ["removalType", "originAddress", "originAccess", "property", "destAddress", "destAccess", "inventory", "extras", "description", "date", "cleaning-offer", "contact", "review"],
  "thatcham-movers": ["contact", "removalType", "originAddress", "property", "originAccess", "destAddress", "destAccess", "date", "inventory", "description", "extras", "cleaning-offer", "review"],
  "newbury-removals": ["date", "removalType", "property", "originAddress", "originAccess", "destAddress", "destAccess", "inventory", "extras", "description", "cleaning-offer", "contact", "review"],
  manyvans: ["originAddress", "destAddress", "removalType", "inventory", "extras", "property", "originAccess", "destAccess", "description", "date", "cleaning-offer", "contact", "review"],
};

const removalsTitles: Record<BrandSlug, Record<string, string>> = {
  ample: { removalType: "Removal type", originAddress: "Current address", originAccess: "Access — current", property: "Property details", destAddress: "Destination address", destAccess: "Access — new home", inventory: "What you're moving", extras: "Extra help", description: "About your move", date: "Move date", "cleaning-offer": "Add cleaning?", contact: "Contact details" },
  "thatcham-movers": { removalType: "What's the move?", originAddress: "Where are you now?", originAccess: "Getting out of your place", property: "Tell us about your home", destAddress: "Where you're headed", destAccess: "Getting into the new place", inventory: "What's coming with you", extras: "Need a hand with anything?", description: "Anything else to know?", date: "When's moving day?", "cleaning-offer": "Fancy a clean too?", contact: "How do we reach you?" },
  "newbury-removals": { removalType: "Your move type", originAddress: "Collection address", originAccess: "Collection access details", property: "About the property", destAddress: "Delivery address", destAccess: "Delivery access details", inventory: "Your belongings", extras: "Additional support", description: "Move notes", date: "Preferred moving date", "cleaning-offer": "Would you like a clean too?", contact: "Your details" },
  manyvans: { removalType: "Pick your move", originAddress: "Pickup spot", originAccess: "Pickup access", property: "Your place", destAddress: "Drop-off spot", destAccess: "Drop-off access", inventory: "What's moving", extras: "Extra muscle?", description: "Anything we should know", date: "Pick a date", "cleaning-offer": "Add a clean?", contact: "Your contact info" },
};

function removalsBuilder(brandSlug: BrandSlug): Builder {
  const order = removalsOrders[brandSlug] ?? removalsOrders.ample;
  const titles = removalsTitles[brandSlug] ?? removalsTitles.ample;
  return (initialPostcode) => ({
    service: "removals",
    slug: "removals",
    apiPath: "/api/bookings/removals",
    schema: SERVICE_SCHEMAS.removals,
    defaultValues: {
      removalType: undefined,
      originPostcode: initialPostcode,
      originAddress: undefined,
      propertyType: undefined,
      bedrooms: undefined,
      destinationPostcode: "",
      destinationAddress: undefined,
      inventory: [],
      floor: undefined,
      hasLift: false, // records "no lift" unless the customer selects Yes
      parkingWithin20m: undefined,
      specialInstructions: "",
      destFloor: undefined,
      destHasLift: false, // records "no lift" unless the customer selects Yes
      destParkingWithin20m: undefined,
      destAccessNotes: "",
      additionalServices: NO_EXTRAS,
      packingHours: 0,
      packingMen: 1,
      dismantleCount: 0,
      assembleCount: 0,
      description: "",
      isFlexibleDate: false,
      moveDate: undefined,
      flexibleDateFrom: undefined,
      flexibleDateTo: undefined,
      fullName: "",
      email: "",
      phone: "",
      confirmed: false,
    } as DefaultValues<FieldValues>,
    steps: buildSteps(order, removalsDict, titles, removalsReviewSections),
  });
}

/* ════════════════════════════════════════════════════════════════════
   MAN & VAN (10 steps)
   ════════════════════════════════════════════════════════════════════ */

const manAndVanDict: Record<string, StepDef> = {
  originAddress: { fields: ["originPostcode", "originAddress"], element: <AddressStep label="What is your current address?" postcodeField="originPostcode" addressField="originAddress" /> },
  destAddress: { fields: ["destinationPostcode", "destinationAddress"], element: <AddressStep label="Where are you going?" postcodeField="destinationPostcode" addressField="destinationAddress" /> },
  vanType: { fields: ["vanType"], element: <VanTypeStep /> },
  hours: { fields: ["hoursNeeded"], element: <HoursNeededStep /> },
  extras: { fields: [], element: <AdditionalServicesStep /> },
  description: { fields: ["description"], element: <DescriptionStep /> },
  date: { fields: ["isFlexibleDate", "moveDate", "flexibleDateFrom", "flexibleDateTo"], element: <MoveDateStep /> },
  "cleaning-offer": { fields: [], element: <CleaningUpsellStep /> },
  contact: { fields: ["fullName", "email", "phone"], element: <ContactDetailsStep /> },
};

const manAndVanReviewSections: ReviewSectionDef[] = [
  { title: "From", editStepId: "originAddress", rows: [{ label: "Address", key: "originAddress" }] },
  { title: "To", editStepId: "destAddress", rows: [{ label: "Address", key: "destinationAddress" }] },
  { title: "Van", editStepId: "vanType", rows: [{ label: "Size", key: "vanType" }] },
  { title: "Hours", editStepId: "hours", rows: [{ label: "Hours needed", key: "hoursNeeded" }] },
  { title: "Extras", editStepId: "extras", rows: [{ label: "Services", key: "additionalServices" }] },
  { title: "About", editStepId: "description", rows: [{ label: "Description", key: "description" }] },
  { title: "Date", editStepId: "date", rows: dateRows },
  { title: "Contact", editStepId: "contact", rows: contactRows },
];

const manAndVanOrders: Record<BrandSlug, string[]> = {
  ample: ["originAddress", "destAddress", "vanType", "hours", "extras", "description", "date", "cleaning-offer", "contact", "review"],
  "thatcham-movers": ["contact", "originAddress", "destAddress", "vanType", "hours", "date", "extras", "description", "cleaning-offer", "review"],
  "newbury-removals": ["date", "vanType", "hours", "originAddress", "destAddress", "extras", "description", "cleaning-offer", "contact", "review"],
  manyvans: ["originAddress", "destAddress", "vanType", "extras", "hours", "description", "date", "cleaning-offer", "contact", "review"],
};

const manAndVanTitles: Record<BrandSlug, Record<string, string>> = {
  ample: { originAddress: "Current address", destAddress: "Destination address", vanType: "Van size", hours: "Hours needed", extras: "Additional services", description: "About your move", date: "Move date", "cleaning-offer": "Add cleaning?", contact: "Contact details" },
  "thatcham-movers": { originAddress: "Where from?", destAddress: "Where to?", vanType: "Which van?", hours: "How long do you need us?", extras: "Anything extra?", description: "Anything else?", date: "When's the job?", "cleaning-offer": "Fancy a clean too?", contact: "How do we reach you?" },
  "newbury-removals": { originAddress: "Collection point", destAddress: "Delivery point", vanType: "Choose your van", hours: "Estimated hours", extras: "Additional support", description: "Job notes", date: "Preferred date", "cleaning-offer": "Add a clean?", contact: "Your details" },
  manyvans: { originAddress: "Pickup", destAddress: "Drop-off", vanType: "Pick your van", hours: "Hours", extras: "Extra help?", description: "Details", date: "Pick a date", "cleaning-offer": "Add a clean?", contact: "Contact info" },
};

function manAndVanBuilder(brandSlug: BrandSlug): Builder {
  const order = manAndVanOrders[brandSlug] ?? manAndVanOrders.ample;
  const titles = manAndVanTitles[brandSlug] ?? manAndVanTitles.ample;
  return (initialPostcode) => ({
    service: "man_and_van",
    slug: "man-and-van",
    apiPath: "/api/bookings/man-and-van",
    schema: SERVICE_SCHEMAS.man_and_van,
    defaultValues: {
      originPostcode: initialPostcode,
      originAddress: undefined,
      destinationPostcode: "",
      destinationAddress: undefined,
      vanType: undefined,
      hoursNeeded: 2,
      additionalServices: NO_EXTRAS,
      description: "",
      isFlexibleDate: false,
      moveDate: undefined,
      flexibleDateFrom: undefined,
      flexibleDateTo: undefined,
      fullName: "",
      email: "",
      phone: "",
      confirmed: false,
    } as DefaultValues<FieldValues>,
    steps: buildSteps(order, manAndVanDict, titles, manAndVanReviewSections),
  });
}

/* ════════════════════════════════════════════════════════════════════
   HOUSE CLEARANCE (9 steps)
   ════════════════════════════════════════════════════════════════════ */

const houseClearanceDict: Record<string, StepDef> = {
  originAddress: { fields: ["originPostcode", "originAddress"], element: <AddressStep label="What is the address of the property to be cleared?" postcodeField="originPostcode" addressField="originAddress" /> },
  property: { fields: ["propertyType", "bedrooms"], element: <PropertyDetailsStep showBedrooms /> },
  clearanceType: { fields: ["clearanceType"], element: <ClearanceTypeStep /> },
  items: { fields: [], element: <ItemsOfNoteStep /> },
  description: { fields: ["description"], element: <DescriptionStep /> },
  date: { fields: ["isFlexibleDate", "moveDate", "flexibleDateFrom", "flexibleDateTo"], element: <MoveDateStep /> },
  "cleaning-offer": { fields: [], element: <CleaningUpsellStep /> },
  contact: { fields: ["fullName", "email", "phone"], element: <ContactDetailsStep /> },
};

const houseClearanceReviewSections: ReviewSectionDef[] = [
  { title: "Property", editStepId: "originAddress", rows: [{ label: "Address", key: "originAddress" }, { label: "Type", key: "propertyType" }, { label: "Bedrooms", key: "bedrooms" }] },
  { title: "Clearance", editStepId: "clearanceType", rows: [{ label: "Type", key: "clearanceType" }, { label: "Items", key: "itemsOfNote" }] },
  { title: "About", editStepId: "description", rows: [{ label: "Description", key: "description" }] },
  { title: "Date", editStepId: "date", rows: dateRows },
  { title: "Contact", editStepId: "contact", rows: contactRows },
];

const houseClearanceOrders: Record<BrandSlug, string[]> = {
  ample: ["originAddress", "property", "clearanceType", "items", "description", "date", "cleaning-offer", "contact", "review"],
  "thatcham-movers": ["contact", "originAddress", "clearanceType", "property", "items", "date", "description", "cleaning-offer", "review"],
  "newbury-removals": ["date", "clearanceType", "originAddress", "property", "items", "description", "cleaning-offer", "contact", "review"],
  manyvans: ["originAddress", "clearanceType", "items", "property", "description", "date", "cleaning-offer", "contact", "review"],
};

const houseClearanceTitles: Record<BrandSlug, Record<string, string>> = {
  ample: { originAddress: "Property address", property: "Property details", clearanceType: "Clearance type", items: "Items of note", description: "About the clearance", date: "Preferred date", "cleaning-offer": "Add cleaning?", contact: "Contact details" },
  "thatcham-movers": { originAddress: "Which property?", property: "Tell us about it", clearanceType: "What kind of clearance?", items: "Anything notable?", description: "Anything else?", date: "When works for you?", "cleaning-offer": "Fancy a clean too?", contact: "How do we reach you?" },
  "newbury-removals": { originAddress: "Property to clear", property: "About the property", clearanceType: "Clearance scope", items: "Notable items", description: "Clearance notes", date: "Preferred date", "cleaning-offer": "Add a clean?", contact: "Your details" },
  manyvans: { originAddress: "The property", property: "A bit about it", clearanceType: "Clearance type", items: "Worth flagging?", description: "Details", date: "Pick a date", "cleaning-offer": "Add a clean?", contact: "Contact info" },
};

function houseClearanceBuilder(brandSlug: BrandSlug): Builder {
  const order = houseClearanceOrders[brandSlug] ?? houseClearanceOrders.ample;
  const titles = houseClearanceTitles[brandSlug] ?? houseClearanceTitles.ample;
  return (initialPostcode) => ({
    service: "house_clearance",
    slug: "house-clearance",
    apiPath: "/api/bookings/house-clearance",
    schema: SERVICE_SCHEMAS.house_clearance,
    defaultValues: {
      originPostcode: initialPostcode,
      originAddress: undefined,
      propertyType: undefined,
      bedrooms: undefined,
      clearanceType: undefined,
      itemsOfNote: [],
      description: "",
      isFlexibleDate: false,
      moveDate: undefined,
      flexibleDateFrom: undefined,
      flexibleDateTo: undefined,
      fullName: "",
      email: "",
      phone: "",
      confirmed: false,
    } as DefaultValues<FieldValues>,
    steps: buildSteps(order, houseClearanceDict, titles, houseClearanceReviewSections),
  });
}

/* ════════════════════════════════════════════════════════════════════
   HOUSE CLEANING (8 steps) — Ample only, no brand variants
   ════════════════════════════════════════════════════════════════════ */
const houseCleaning: Builder = (initialPostcode) => ({
  service: "house_cleaning",
  slug: "house-cleaning",
  apiPath: "/api/bookings/house-cleaning",
  schema: SERVICE_SCHEMAS.house_cleaning,
  defaultValues: {
    originPostcode: initialPostcode,
    originAddress: undefined,
    propertyType: undefined,
    bedrooms: undefined,
    cleaningType: undefined,
    frequency: undefined,
    moveDate: undefined,
    timeSlot: undefined,
    accessInstructions: "",
    fullName: "",
    email: "",
    phone: "",
    confirmed: false,
  } as DefaultValues<FieldValues>,
  steps: [
    step("originAddress", "Property address", ["originPostcode", "originAddress"], <AddressStep label="What is the address of the property to be cleaned?" postcodeField="originPostcode" addressField="originAddress" />),
    step("property", "Property details", ["propertyType", "bedrooms"], <PropertyDetailsStep showBedrooms />),
    step("cleaningType", "Cleaning type", ["cleaningType"], <CleaningTypeStep />),
    step("frequency", "Frequency", ["frequency"], <FrequencyStep />),
    step("datetime", "Date & time", ["moveDate", "timeSlot"], <CleaningDateTimeStep />),
    step("access", "Access", [], <AccessInstructionsStep />),
    step("contact", "Contact details", ["fullName", "email", "phone"], <ContactDetailsStep />),
    reviewStep([
      { title: "Property", editStep: 0, rows: [{ label: "Address", key: "originAddress" }, { label: "Type", key: "propertyType" }, { label: "Bedrooms", key: "bedrooms" }] },
      { title: "Cleaning", editStep: 2, rows: [{ label: "Type", key: "cleaningType" }, { label: "Frequency", key: "frequency" }] },
      { title: "Date & time", editStep: 4, rows: [{ label: "Date", key: "moveDate" }, { label: "Time", key: "timeSlot" }] },
      { title: "Access", editStep: 5, rows: [{ label: "Instructions", key: "accessInstructions" }] },
      { title: "Contact", editStep: 6, rows: contactRows },
    ]),
  ],
});

/* ════════════════════════════════════════════════════════════════════
   END OF TENANCY (7 steps) — Ample only, no brand variants
   ════════════════════════════════════════════════════════════════════ */
const endOfTenancy: Builder = (initialPostcode) => ({
  service: "end_of_tenancy",
  slug: "end-of-tenancy",
  apiPath: "/api/bookings/end-of-tenancy",
  schema: SERVICE_SCHEMAS.end_of_tenancy,
  defaultValues: {
    originPostcode: initialPostcode,
    originAddress: undefined,
    propertyType: undefined,
    bedrooms: undefined,
    addons: [],
    tenancyEndDate: undefined,
    accessInstructions: "",
    fullName: "",
    email: "",
    phone: "",
    confirmed: false,
  } as DefaultValues<FieldValues>,
  steps: [
    step("originAddress", "Property address", ["originPostcode", "originAddress"], <AddressStep label="What is the address of the property?" postcodeField="originPostcode" addressField="originAddress" />),
    step("property", "Property details", ["propertyType", "bedrooms"], <PropertyDetailsStep showBedrooms />),
    step("addons", "Add-ons", [], <AddOnsStep />),
    step("tenancyEnd", "Tenancy end date", ["tenancyEndDate"], <SingleDateStep name="tenancyEndDate" label="When does your tenancy end?" subtitle="No past dates." />),
    step("access", "Access", [], <AccessInstructionsStep />),
    step("contact", "Contact details", ["fullName", "email", "phone"], <ContactDetailsStep />),
    reviewStep([
      { title: "Property", editStep: 0, rows: [{ label: "Address", key: "originAddress" }, { label: "Type", key: "propertyType" }, { label: "Bedrooms", key: "bedrooms" }] },
      { title: "Add-ons", editStep: 2, rows: [{ label: "Selected", key: "addons" }] },
      { title: "Tenancy", editStep: 3, rows: [{ label: "End date", key: "tenancyEndDate" }] },
      { title: "Access", editStep: 4, rows: [{ label: "Instructions", key: "accessInstructions" }] },
      { title: "Contact", editStep: 5, rows: contactRows },
    ]),
  ],
});

const BUILDERS: Record<string, (brandSlug: BrandSlug) => Builder> = {
  removals: removalsBuilder,
  "man-and-van": manAndVanBuilder,
  "house-clearance": houseClearanceBuilder,
  "house-cleaning": () => houseCleaning,
  "end-of-tenancy": () => endOfTenancy,
};

export function buildWizardConfig(
  slug: string,
  initialPostcode = "",
  brandSlug: BrandSlug = "ample"
): WizardConfig<FieldValues> | null {
  const builderFactory = BUILDERS[slug];
  if (!builderFactory) return null;
  return builderFactory(brandSlug)(initialPostcode);
}
