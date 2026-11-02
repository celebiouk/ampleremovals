"use client";

import { useMemo } from "react";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { buildWizardConfig, type BrandSlug } from "@/components/booking/wizard-configs";

export function BookingFlow({
  slug,
  initialPostcode = "",
  brandSlug = "ample",
}: {
  slug: string;
  initialPostcode?: string;
  /** Which white-label brand is running this booking — changes step
   *  order/wording (see wizard-configs.tsx) and the wizard shell's look
   *  (see BookingWizard.tsx). Defaults to Ample's own flow, unchanged. */
  brandSlug?: BrandSlug;
}) {
  // Built once per slug+brand — keeps the step elements/identity stable.
  const config = useMemo(
    () => buildWizardConfig(slug, initialPostcode, brandSlug),
    [slug, initialPostcode, brandSlug]
  );

  if (!config) return null;
  return <BookingWizard config={config} brandSlug={brandSlug} />;
}
