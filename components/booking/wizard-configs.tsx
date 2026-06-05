import type { ReactNode } from "react";
import type { DefaultValues, FieldValues } from "react-hook-form";
import type { WizardConfig, WizardStep } from "@/components/booking/types";
import { SERVICE_SCHEMAS } from "@/lib/schemas/booking";
import { PostcodeStep } from "@/components/booking/steps/PostcodeStep";
import { AddressSelectStep } from "@/components/booking/steps/AddressSelectStep";
import { PropertyDetailsStep } from "@/components/booking/steps/PropertyDetailsStep";
import { AdditionalServicesStep } from "@/components/booking/steps/AdditionalServicesStep";
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

/* ── Removals (11 steps) ──────────────────────────────────── */
const removals: Builder = (initialPostcode) => ({
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
  steps: [
    step("removalType", "Removal type", ["removalType"], <RemovalTypeStep />),
    step("originPostcode", "Current postcode", ["originPostcode"], <PostcodeStep label="What is your current postcode?" name="originPostcode" group="origin" />),
    step("originAddress", "Current address", ["originAddress"], <AddressSelectStep label="Select your current address" name="originAddress" group="origin" />),
    step("property", "Property details", ["propertyType", "bedrooms"], <PropertyDetailsStep showBedrooms />),
    step("destPostcode", "Destination postcode", ["destinationPostcode"], <PostcodeStep label="What is the postcode you are moving to?" name="destinationPostcode" group="destination" />),
    step("destAddress", "Destination address", ["destinationAddress"], <AddressSelectStep label="Select your destination address" name="destinationAddress" group="destination" />),
    step("extras", "Additional services", [], <AdditionalServicesStep />),
    step("description", "About your move", ["description"], <DescriptionStep />),
    step("date", "Move date", ["isFlexibleDate", "moveDate", "flexibleDateFrom", "flexibleDateTo"], <MoveDateStep />),
    step("contact", "Contact details", ["fullName", "email", "phone"], <ContactDetailsStep />),
    reviewStep([
      { title: "Removal", editStep: 0, rows: [{ label: "Type", key: "removalType" }] },
      { title: "From", editStep: 2, rows: [{ label: "Address", key: "originAddress" }] },
      { title: "Property", editStep: 3, rows: [{ label: "Type", key: "propertyType" }, { label: "Bedrooms", key: "bedrooms" }] },
      { title: "To", editStep: 5, rows: [{ label: "Address", key: "destinationAddress" }] },
      { title: "Extras", editStep: 6, rows: [{ label: "Services", key: "additionalServices" }] },
      { title: "About", editStep: 7, rows: [{ label: "Description", key: "description" }] },
      { title: "Date", editStep: 8, rows: dateRows },
      { title: "Contact", editStep: 9, rows: contactRows },
    ]),
  ],
});

/* ── Man & Van (10 steps) ─────────────────────────────────── */
const manAndVan: Builder = (initialPostcode) => ({
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
  steps: [
    step("originPostcode", "Current postcode", ["originPostcode"], <PostcodeStep label="What is your current postcode?" name="originPostcode" group="origin" />),
    step("originAddress", "Current address", ["originAddress"], <AddressSelectStep label="Select your current address" name="originAddress" group="origin" />),
    step("destPostcode", "Destination postcode", ["destinationPostcode"], <PostcodeStep label="Where are you going?" name="destinationPostcode" group="destination" />),
    step("destAddress", "Destination address", ["destinationAddress"], <AddressSelectStep label="Select your destination address" name="destinationAddress" group="destination" />),
    step("vanType", "Van size", ["vanType"], <VanTypeStep />),
    step("extras", "Additional services", [], <AdditionalServicesStep />),
    step("description", "About your move", ["description"], <DescriptionStep />),
    step("date", "Move date", ["isFlexibleDate", "moveDate", "flexibleDateFrom", "flexibleDateTo"], <MoveDateStep />),
    step("contact", "Contact details", ["fullName", "email", "phone"], <ContactDetailsStep />),
    reviewStep([
      { title: "From", editStep: 1, rows: [{ label: "Address", key: "originAddress" }] },
      { title: "To", editStep: 3, rows: [{ label: "Address", key: "destinationAddress" }] },
      { title: "Van", editStep: 4, rows: [{ label: "Size", key: "vanType" }] },
      { title: "Extras", editStep: 5, rows: [{ label: "Services", key: "additionalServices" }] },
      { title: "About", editStep: 6, rows: [{ label: "Description", key: "description" }] },
      { title: "Date", editStep: 7, rows: dateRows },
      { title: "Contact", editStep: 8, rows: contactRows },
    ]),
  ],
});

/* ── House Clearance (9 steps) ────────────────────────────── */
const houseClearance: Builder = (initialPostcode) => ({
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
  steps: [
    step("originPostcode", "Property postcode", ["originPostcode"], <PostcodeStep label="What is the postcode of the property to be cleared?" name="originPostcode" group="origin" />),
    step("originAddress", "Property address", ["originAddress"], <AddressSelectStep label="Select the property address" name="originAddress" group="origin" />),
    step("property", "Property details", ["propertyType", "bedrooms"], <PropertyDetailsStep showBedrooms />),
    step("clearanceType", "Clearance type", ["clearanceType"], <ClearanceTypeStep />),
    step("items", "Items of note", [], <ItemsOfNoteStep />),
    step("description", "About the clearance", ["description"], <DescriptionStep />),
    step("date", "Preferred date", ["isFlexibleDate", "moveDate", "flexibleDateFrom", "flexibleDateTo"], <MoveDateStep />),
    step("contact", "Contact details", ["fullName", "email", "phone"], <ContactDetailsStep />),
    reviewStep([
      { title: "Property", editStep: 1, rows: [{ label: "Address", key: "originAddress" }, { label: "Type", key: "propertyType" }, { label: "Bedrooms", key: "bedrooms" }] },
      { title: "Clearance", editStep: 3, rows: [{ label: "Type", key: "clearanceType" }, { label: "Items", key: "itemsOfNote" }] },
      { title: "About", editStep: 5, rows: [{ label: "Description", key: "description" }] },
      { title: "Date", editStep: 6, rows: dateRows },
      { title: "Contact", editStep: 7, rows: contactRows },
    ]),
  ],
});

/* ── House Cleaning (9 steps) ─────────────────────────────── */
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
    step("originPostcode", "Property postcode", ["originPostcode"], <PostcodeStep label="What is the postcode of the property to be cleaned?" name="originPostcode" group="origin" />),
    step("originAddress", "Property address", ["originAddress"], <AddressSelectStep label="Select the property address" name="originAddress" group="origin" />),
    step("property", "Property details", ["propertyType", "bedrooms"], <PropertyDetailsStep showBedrooms />),
    step("cleaningType", "Cleaning type", ["cleaningType"], <CleaningTypeStep />),
    step("frequency", "Frequency", ["frequency"], <FrequencyStep />),
    step("datetime", "Date & time", ["moveDate", "timeSlot"], <CleaningDateTimeStep />),
    step("access", "Access", [], <AccessInstructionsStep />),
    step("contact", "Contact details", ["fullName", "email", "phone"], <ContactDetailsStep />),
    reviewStep([
      { title: "Property", editStep: 1, rows: [{ label: "Address", key: "originAddress" }, { label: "Type", key: "propertyType" }, { label: "Bedrooms", key: "bedrooms" }] },
      { title: "Cleaning", editStep: 3, rows: [{ label: "Type", key: "cleaningType" }, { label: "Frequency", key: "frequency" }] },
      { title: "Date & time", editStep: 5, rows: [{ label: "Date", key: "moveDate" }, { label: "Time", key: "timeSlot" }] },
      { title: "Access", editStep: 6, rows: [{ label: "Instructions", key: "accessInstructions" }] },
      { title: "Contact", editStep: 7, rows: contactRows },
    ]),
  ],
});

/* ── End of Tenancy (8 steps) ─────────────────────────────── */
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
    step("originPostcode", "Property postcode", ["originPostcode"], <PostcodeStep label="What is the postcode of the property?" name="originPostcode" group="origin" />),
    step("originAddress", "Property address", ["originAddress"], <AddressSelectStep label="Select the property address" name="originAddress" group="origin" />),
    step("property", "Property details", ["propertyType", "bedrooms"], <PropertyDetailsStep showBedrooms />),
    step("addons", "Add-ons", [], <AddOnsStep />),
    step("tenancyEnd", "Tenancy end date", ["tenancyEndDate"], <SingleDateStep name="tenancyEndDate" label="When does your tenancy end?" subtitle="No past dates." />),
    step("access", "Access", [], <AccessInstructionsStep />),
    step("contact", "Contact details", ["fullName", "email", "phone"], <ContactDetailsStep />),
    reviewStep([
      { title: "Property", editStep: 1, rows: [{ label: "Address", key: "originAddress" }, { label: "Type", key: "propertyType" }, { label: "Bedrooms", key: "bedrooms" }] },
      { title: "Add-ons", editStep: 3, rows: [{ label: "Selected", key: "addons" }] },
      { title: "Tenancy", editStep: 4, rows: [{ label: "End date", key: "tenancyEndDate" }] },
      { title: "Access", editStep: 5, rows: [{ label: "Instructions", key: "accessInstructions" }] },
      { title: "Contact", editStep: 6, rows: contactRows },
    ]),
  ],
});

const BUILDERS: Record<string, Builder> = {
  removals,
  "man-and-van": manAndVan,
  "house-clearance": houseClearance,
  "house-cleaning": houseCleaning,
  "end-of-tenancy": endOfTenancy,
};

export function buildWizardConfig(
  slug: string,
  initialPostcode = ""
): WizardConfig<FieldValues> | null {
  const builder = BUILDERS[slug];
  return builder ? builder(initialPostcode) : null;
}
