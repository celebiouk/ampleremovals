"use client";

import { useCallback, useState } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { WizardConfig } from "@/components/booking/types";
import { readAttribution } from "@/lib/attribution";
import { trackLead } from "@/lib/pixels";
import { toISODate } from "@/lib/utils";

/**
 * Orchestrates a service booking wizard: React Hook Form + Zod, per-step
 * validation, step navigation (with slide direction) and final submission to
 * the relevant /api/bookings/[service] route.
 */
export function useBookingForm<T extends FieldValues>(config: WizardConfig<T>) {
  const router = useRouter();
  const totalSteps = config.steps.length;

  const form = useForm<T>({
    resolver: zodResolver(config.schema),
    defaultValues: config.defaultValues,
    mode: "onTouched",
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const currentMeta = config.steps[currentStep];

  /** Validate the fields owned by the current step. */
  const validateStep = useCallback(async () => {
    const fields = currentMeta?.fields ?? [];
    if (fields.length === 0) return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return form.trigger(fields as any, { shouldFocus: true });
  }, [currentMeta, form]);

  const next = useCallback(async () => {
    const ok = await validateStep();
    if (!ok) return;
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [validateStep, totalSteps]);

  const back = useCallback(() => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      setDirection(step > currentStep ? 1 : -1);
      setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));
    },
    [currentStep, totalSteps]
  );

  const submit = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) {
      toast.error("Please complete all required fields before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const values = form.getValues();
      // Date pickers give us a Date at the customer's local midnight. Send date
      // fields as plain YYYY-MM-DD (local) strings so JSON.stringify can't
      // convert them to UTC and shift BST dates back a day. Any top-level Date
      // (moveDate, flexibleDateFrom/To, tenancyEndDate) is normalised here.
      const payload = Object.fromEntries(
        Object.entries(values).map(([key, value]) =>
          value instanceof Date ? [key, toISODate(value)] : [key, value]
        )
      );
      const res = await fetch(config.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Attach first-touch marketing attribution (utm/click ids/referrer).
        body: JSON.stringify({ ...payload, attribution: readAttribution() }),
      });
      const data = (await res.json()) as {
        success: boolean;
        reference?: string;
        bookingId?: string;
        quoteToken?: string | null;
        error?: string;
      };

      if (!res.ok || !data.success || !data.reference) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      // Fire conversion pixels (no-ops if pixels aren't configured).
      trackLead({ reference: data.reference, service: config.slug });

      // Removals gets the instant-quote → reserve → deposit flow. Every other
      // service keeps the plain confirmation page.
      if (config.slug === "removals" && data.bookingId && data.quoteToken) {
        router.push(`/quote/${data.bookingId}/${data.quoteToken}`);
      } else {
        router.push(
          `/confirmation?ref=${encodeURIComponent(
            data.reference
          )}&service=${config.slug}`
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      toast.error(message);
      setIsSubmitting(false);
    }
  }, [config.apiPath, config.slug, form, router]);

  return {
    form,
    currentStep,
    totalSteps,
    direction,
    currentMeta,
    isFirstStep,
    isLastStep,
    isSubmitting,
    next,
    back,
    goToStep,
    submit,
  };
}

export type BookingFormApi<T extends FieldValues = FieldValues> = ReturnType<
  typeof useBookingForm<T>
>;
