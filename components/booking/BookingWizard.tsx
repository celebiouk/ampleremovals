"use client";

import { FormProvider, type FieldValues } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBookingForm } from "@/hooks/useBookingForm";
import { WizardProvider } from "@/components/booking/WizardContext";
import type { WizardConfig } from "@/components/booking/types";

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function BookingWizard<T extends FieldValues>({
  config,
}: {
  config: WizardConfig<T>;
}) {
  const wizard = useBookingForm(config);
  const {
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
  } = wizard;

  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);
  // `confirmed` gates the final submit (set on the Review step).
  const confirmed = Boolean(form.watch("confirmed" as never));

  return (
    <FormProvider {...form}>
      <WizardProvider goToStep={goToStep}>
        <div className="mx-auto w-full max-w-[680px]">
          {/* Progress header (above the card) */}
          <div className="mb-5 px-1">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-brand-purple-800">
                Step {currentStep + 1} of {totalSteps}
                <span className="ml-2 font-medium text-slate-500">
                  {currentMeta?.title}
                </span>
              </span>
              <span className="text-slate-400">{progress}%</span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-brand-purple-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-purple-700 to-brand-purple-500"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Wizard card */}
          <div className="rounded-none bg-white p-5 shadow-none sm:rounded-2xl sm:p-8 sm:shadow-xl sm:shadow-brand-purple-900/10">
            <div className="min-h-[320px] pb-28 sm:pb-0">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {currentMeta?.element}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop buttons */}
            <div className="mt-8 hidden items-center justify-between gap-3 sm:flex">
              <BackButton onClick={back} disabled={isFirstStep} />
              {isLastStep ? (
                <SubmitButton
                  onClick={submit}
                  loading={isSubmitting}
                  disabled={!confirmed}
                />
              ) : (
                <NextButton onClick={next} />
              )}
            </div>
          </div>

          {/* Mobile sticky bottom bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-slate-200 bg-white p-4 sm:hidden">
            <BackButton onClick={back} disabled={isFirstStep} fullWidth />
            {isLastStep ? (
              <SubmitButton
                onClick={submit}
                loading={isSubmitting}
                disabled={!confirmed}
                fullWidth
              />
            ) : (
              <NextButton onClick={next} fullWidth />
            )}
          </div>

          {/* Help line */}
          <p className="mt-5 px-1 text-center text-sm text-slate-400">
            Need a hand? Call us on{" "}
            <Link href="tel:+443335772070" className="font-semibold text-brand-purple-700">
              0333 577 2070
            </Link>
          </p>
        </div>
      </WizardProvider>
    </FormProvider>
  );
}

/* ── Buttons ──────────────────────────────────────────────── */
function BackButton({
  onClick,
  disabled,
  fullWidth,
}: {
  onClick: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-base font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-0",
        fullWidth && "flex-1"
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}

function NextButton({
  onClick,
  fullWidth,
}: {
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-purple-800 px-7 py-3 text-base font-bold text-white shadow-lg shadow-brand-purple-800/25 transition-all hover:bg-brand-purple-700 active:scale-95",
        fullWidth ? "flex-[2]" : "min-w-[140px]"
      )}
    >
      Continue
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function SubmitButton({
  onClick,
  loading,
  disabled,
  fullWidth,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green-600 px-7 py-3 text-base font-bold text-white shadow-lg shadow-brand-green-600/25 transition-all hover:bg-brand-green-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        fullWidth ? "flex-[2]" : "min-w-[180px]"
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Submitting…
        </>
      ) : (
        <>
          <Check className="h-5 w-5" />
          Submit booking
        </>
      )}
    </button>
  );
}
