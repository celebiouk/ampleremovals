import type { ReactNode } from "react";
import type { FieldValues, DefaultValues } from "react-hook-form";
import type { z } from "zod";
import type { ServiceType } from "@/types";

/** Metadata + rendered element for a single wizard step. */
export interface WizardStep {
  id: string;
  /** Shown in the step indicator ("Step X of Y — {title}"). */
  title: string;
  /** Form field names validated before leaving this step. */
  fields: string[];
  /** The rendered step UI. */
  element: ReactNode;
}

export interface WizardConfig<T extends FieldValues = FieldValues> {
  service: ServiceType;
  slug: string;
  apiPath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<any, any, any>;
  defaultValues: DefaultValues<T>;
  steps: WizardStep[];
  /**
   * When present, the wizard is COMPLETING an existing admin-created lead rather
   * than creating a new booking: submit updates that booking (via the completion
   * endpoint) and routes to its quote page.
   */
  completion?: { bookingId: string; token: string };
}
