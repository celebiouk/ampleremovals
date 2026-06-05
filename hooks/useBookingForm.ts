"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Lightweight multi-step booking form state manager. The booking wizard
 * (Phase 2) builds on top of this — it tracks the current step and an
 * accumulating, loosely-typed payload that each step contributes to.
 */
export function useBookingForm<T extends Record<string, unknown>>(
  totalSteps: number,
  initialData: Partial<T> = {}
) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Partial<T>>(initialData);
  const [submitting, setSubmitting] = useState(false);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const updateData = useCallback((patch: Partial<T>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const next = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [totalSteps]);

  const back = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));
    },
    [totalSteps]
  );

  const reset = useCallback(() => {
    setCurrentStep(0);
    setData(initialData);
    setSubmitting(false);
  }, [initialData]);

  const progress = useMemo(
    () => Math.round(((currentStep + 1) / totalSteps) * 100),
    [currentStep, totalSteps]
  );

  return {
    currentStep,
    data,
    submitting,
    setSubmitting,
    isFirstStep,
    isLastStep,
    progress,
    updateData,
    next,
    back,
    goToStep,
    reset,
  };
}
