"use client";

import { useMemo } from "react";
import type { FieldValues } from "react-hook-form";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { buildWizardConfig } from "@/components/booking/wizard-configs";
import type { WizardConfig } from "@/components/booking/types";

/**
 * Renders the Removals wizard in "completion" mode for an admin-created lead:
 * the same steps as the public flow, but with the customer's contact details
 * pre-filled and submission wired to update the existing booking (see
 * WizardConfig.completion + useBookingForm).
 */
export function CompletionFlow({
  bookingId,
  token,
  defaults,
}: {
  bookingId: string;
  token: string;
  defaults: { fullName: string; email: string; phone: string };
}) {
  const config = useMemo<WizardConfig<FieldValues> | null>(() => {
    const base = buildWizardConfig("removals");
    if (!base) return null;
    return {
      ...base,
      completion: { bookingId, token },
      defaultValues: {
        ...base.defaultValues,
        fullName: defaults.fullName,
        email: defaults.email,
        phone: defaults.phone,
      },
    };
  }, [bookingId, token, defaults]);

  if (!config) return null;
  return <BookingWizard config={config} />;
}
