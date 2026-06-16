import { z } from "zod";
import type { ServiceType } from "@/types";

/* ── Primitive validators ─────────────────────────────────── */

/** Normalise a UK phone number (strip spaces, brackets, dashes). */
const normalisePhone = (v: string) => v.replace(/[\s()-]/g, "");

export const ukPhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine(
    (v) => /^(?:\+44|0)\d{9,10}$/.test(normalisePhone(v)),
    "Enter a valid UK phone number (e.g. 07123 456789)"
  );

export const postcodeSchema = z
  .string()
  .trim()
  .min(5, "Enter a full postcode")
  .max(8, "That postcode looks too long");

export const AddressOptionSchema = z.object({
  line_1: z.string().trim().min(1, "Please enter the building number/name and street"),
  line_2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  postcode: z.string().trim().min(1),
});

export const AdditionalServicesSchema = z.object({
  packing_services: z.boolean(),
  packing_materials: z.boolean(),
  disassemble_furniture: z.boolean(),
  assemble_furniture: z.boolean(),
});

const propertyTypeSchema = z.enum(["flat", "house", "bungalow"], {
  message: "Select a property type",
});
const bedroomsSchema = z.enum(["studio", "1", "2", "3", "4", "5+"], {
  message: "Select the number of bedrooms",
});

const contactFields = {
  fullName: z.string().trim().min(2, "Please enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: ukPhoneSchema,
  heardAbout: z.string().trim().max(100).optional(),
};

const flexibleDateFields = {
  isFlexibleDate: z.boolean(),
  moveDate: z.coerce.date().optional(),
  flexibleDateFrom: z.coerce.date().optional(),
  flexibleDateTo: z.coerce.date().optional(),
};

/** Shared refinement for the flexible/specific date step. */
function validateFlexibleDate(
  d: {
    isFlexibleDate: boolean;
    moveDate?: Date;
    flexibleDateFrom?: Date;
    flexibleDateTo?: Date;
  },
  ctx: z.RefinementCtx
) {
  if (d.isFlexibleDate) {
    if (!d.flexibleDateFrom)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["flexibleDateFrom"],
        message: "Select an earliest date",
      });
    if (!d.flexibleDateTo)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["flexibleDateTo"],
        message: "Select a latest date",
      });
    if (
      d.flexibleDateFrom &&
      d.flexibleDateTo &&
      d.flexibleDateTo < d.flexibleDateFrom
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["flexibleDateTo"],
        message: "Latest date must be on or after the earliest date",
      });
  } else if (!d.moveDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["moveDate"],
      message: "Select your preferred date",
    });
  }
}

/* ── Service schemas ──────────────────────────────────────── */

export const RemovalsFormSchema = z
  .object({
    removalType: z.enum(["domestic", "business"], {
      message: "Select a removal type",
    }),
    originPostcode: postcodeSchema,
    originAddress: AddressOptionSchema,
    propertyType: propertyTypeSchema,
    bedrooms: bedroomsSchema,
    destinationPostcode: postcodeSchema,
    destinationAddress: AddressOptionSchema,
    additionalServices: AdditionalServicesSchema,
    description: z.string().trim().min(20, "Please give us at least 20 characters of detail"),
    ...flexibleDateFields,
    ...contactFields,
  })
  .superRefine(validateFlexibleDate);

export const ManAndVanFormSchema = z
  .object({
    originPostcode: postcodeSchema,
    originAddress: AddressOptionSchema,
    destinationPostcode: postcodeSchema,
    destinationAddress: AddressOptionSchema,
    vanType: z.enum(["small", "medium", "large"], {
      message: "Select a van size",
    }),
    additionalServices: AdditionalServicesSchema,
    description: z.string().trim().min(20, "Please give us at least 20 characters of detail"),
    ...flexibleDateFields,
    ...contactFields,
  })
  .superRefine(validateFlexibleDate);

export const HouseClearanceFormSchema = z
  .object({
    originPostcode: postcodeSchema,
    originAddress: AddressOptionSchema,
    propertyType: propertyTypeSchema,
    bedrooms: bedroomsSchema,
    clearanceType: z.enum(["full", "partial", "single_room"], {
      message: "Select a clearance type",
    }),
    itemsOfNote: z.array(z.string()).default([]),
    description: z.string().trim().min(20, "Please give us at least 20 characters of detail"),
    ...flexibleDateFields,
    ...contactFields,
  })
  .superRefine(validateFlexibleDate);

export const HouseCleaningFormSchema = z.object({
  originPostcode: postcodeSchema,
  originAddress: AddressOptionSchema,
  propertyType: propertyTypeSchema,
  bedrooms: bedroomsSchema,
  cleaningType: z.enum(["regular", "deep", "one_off"], {
    message: "Select a cleaning type",
  }),
  frequency: z.enum(["one_off", "weekly", "fortnightly", "monthly"], {
    message: "Select a frequency",
  }),
  moveDate: z.coerce.date({ message: "Select your preferred date" }),
  timeSlot: z.enum(["morning", "afternoon"], {
    message: "Select a time slot",
  }),
  accessInstructions: z.string().trim().optional(),
  ...contactFields,
});

export const EndOfTenancyFormSchema = z.object({
  originPostcode: postcodeSchema,
  originAddress: AddressOptionSchema,
  propertyType: propertyTypeSchema,
  bedrooms: bedroomsSchema,
  addons: z.array(z.string()).default([]),
  tenancyEndDate: z.coerce.date({ message: "Select your tenancy end date" }),
  accessInstructions: z.string().trim().optional(),
  ...contactFields,
});

/* ── Inferred types ───────────────────────────────────────── */
export type RemovalsForm = z.infer<typeof RemovalsFormSchema>;
export type ManAndVanForm = z.infer<typeof ManAndVanFormSchema>;
export type HouseClearanceForm = z.infer<typeof HouseClearanceFormSchema>;
export type HouseCleaningForm = z.infer<typeof HouseCleaningFormSchema>;
export type EndOfTenancyForm = z.infer<typeof EndOfTenancyFormSchema>;

export type AnyBookingForm =
  | RemovalsForm
  | ManAndVanForm
  | HouseClearanceForm
  | HouseCleaningForm
  | EndOfTenancyForm;

/** Schema registry keyed by service_type enum value. */
export const SERVICE_SCHEMAS = {
  removals: RemovalsFormSchema,
  man_and_van: ManAndVanFormSchema,
  house_clearance: HouseClearanceFormSchema,
  house_cleaning: HouseCleaningFormSchema,
  end_of_tenancy: EndOfTenancyFormSchema,
} satisfies Record<ServiceType, z.ZodTypeAny>;
