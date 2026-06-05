"use client";

import { useMemo } from "react";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { buildWizardConfig } from "@/components/booking/wizard-configs";

export function BookingFlow({
  slug,
  initialPostcode = "",
}: {
  slug: string;
  initialPostcode?: string;
}) {
  // Built once per slug — keeps the step elements/identity stable.
  const config = useMemo(
    () => buildWizardConfig(slug, initialPostcode),
    [slug, initialPostcode]
  );

  if (!config) return null;
  return <BookingWizard config={config} />;
}
