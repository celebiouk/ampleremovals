"use client";

import { FormProvider, type FieldValues } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBookingForm } from "@/hooks/useBookingForm";
import { WizardProvider } from "@/components/booking/WizardContext";
import { BRAND_BY_SLUG, AMPLE_BRAND } from "@/lib/brands";
import type { BrandSlug } from "@/components/booking/wizard-configs";
import type { WizardConfig } from "@/components/booking/types";

/**
 * One wizard "shell" per brand — the progress indicator style, the
 * card's corner/shadow treatment, the step-change animation, and the
 * three button labels. This is deliberately separate from colour
 * theming (which is CSS-variable driven, see lib/brand-theme.ts): the
 * goal here is that the wizard doesn't just look recoloured, it moves
 * and reads differently brand to brand. Ample's entry reproduces the
 * wizard's original look exactly — nothing changes for Ample or for
 * the admin-side CompletionFlow (which never passes a brandSlug).
 */
interface ShellVariant {
  progress: "bar" | "dots" | "minimal";
  cardClass: string;
  motionVariants: {
    enter: (dir: number) => Record<string, number>;
    center: Record<string, number>;
    exit: (dir: number) => Record<string, number>;
  };
  transitionDuration: number;
  labels: { back: string; next: string; submit: string; submitting: string };
}

const SHELL_VARIANTS: Record<BrandSlug, ShellVariant> = {
  ample: {
    progress: "bar",
    cardClass: "rounded-none bg-white p-5 shadow-none sm:rounded-2xl sm:p-8 sm:shadow-xl sm:shadow-brand-purple-900/10",
    motionVariants: {
      enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
    },
    transitionDuration: 0.2,
    labels: { back: "Back", next: "Continue", submit: "Submit booking", submitting: "Submitting…" },
  },
  "thatcham-movers": {
    progress: "dots",
    cardClass: "rounded-none bg-white p-5 shadow-none sm:rounded-lg sm:p-8 sm:border sm:border-brand-purple-200",
    motionVariants: {
      enter: () => ({ opacity: 0 }),
      center: { opacity: 1 },
      exit: () => ({ opacity: 0 }),
    },
    transitionDuration: 0.15,
    labels: { back: "Previous", next: "Continue", submit: "Get My Price", submitting: "Sending…" },
  },
  "newbury-removals": {
    progress: "minimal",
    cardClass: "rounded-none bg-white p-5 shadow-none sm:rounded-3xl sm:p-10 sm:shadow-2xl sm:shadow-brand-purple-900/5",
    motionVariants: {
      enter: (dir) => ({ y: dir > 0 ? 24 : -24, opacity: 0 }),
      center: { y: 0, opacity: 1 },
      exit: (dir) => ({ y: dir > 0 ? -24 : 24, opacity: 0 }),
    },
    transitionDuration: 0.25,
    labels: { back: "Go back", next: "Next", submit: "See My Quote", submitting: "One moment…" },
  },
  manyvans: {
    progress: "minimal",
    cardClass: "rounded-none bg-white p-5 shadow-none sm:rounded-xl sm:p-7 sm:border-2 sm:border-brand-purple-800",
    motionVariants: {
      enter: () => ({ scale: 0.97, opacity: 0 }),
      center: { scale: 1, opacity: 1 },
      exit: () => ({ scale: 0.97, opacity: 0 }),
    },
    transitionDuration: 0.15,
    labels: { back: "Back", next: "Keep Going", submit: "Show Me The Price", submitting: "Loading…" },
  },
};

export function BookingWizard<T extends FieldValues>({
  config,
  brandSlug = "ample",
}: {
  config: WizardConfig<T>;
  /** Defaults to Ample — the admin-side CompletionFlow never passes this,
   *  so it always renders the original shell. */
  brandSlug?: BrandSlug;
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
  const shell = SHELL_VARIANTS[brandSlug] ?? SHELL_VARIANTS.ample;
  const brand = BRAND_BY_SLUG[brandSlug] ?? AMPLE_BRAND;

  return (
    <FormProvider {...form}>
      <WizardProvider goToStep={goToStep} admin={Boolean(config.completion?.admin)}>
        <div className="mx-auto w-full max-w-[680px]">
          {/* Progress header (above the card) — style varies per brand */}
          <div className="mb-5 px-1">
            {shell.progress === "bar" && (
              <>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-brand-purple-800">
                    Step {currentStep + 1} of {totalSteps}
                    <span className="ml-2 font-medium text-slate-500">{currentMeta?.title}</span>
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
              </>
            )}

            {shell.progress === "dots" && (
              <>
                <p className="mb-2 text-sm font-semibold text-brand-purple-800">{currentMeta?.title}</p>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-2 flex-1 rounded-full transition-colors",
                        i <= currentStep ? "bg-brand-purple-700" : "bg-brand-purple-100"
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            {shell.progress === "minimal" && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-brand-purple-800">{currentMeta?.title}</p>
                <p className="text-xs font-medium tabular-nums text-slate-400">{currentStep + 1}/{totalSteps}</p>
              </div>
            )}
          </div>

          {/* Wizard card */}
          <div className={shell.cardClass}>
            <div className="min-h-[320px] pb-28 sm:pb-0">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={shell.motionVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: shell.transitionDuration, ease: "easeOut" }}
                >
                  {currentMeta?.element}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop buttons */}
            <div className="mt-8 hidden items-center justify-between gap-3 sm:flex">
              <BackButton onClick={back} disabled={isFirstStep} label={shell.labels.back} />
              {isLastStep ? (
                <SubmitButton onClick={submit} loading={isSubmitting} disabled={!confirmed} label={shell.labels.submit} loadingLabel={shell.labels.submitting} />
              ) : (
                <NextButton onClick={next} label={shell.labels.next} />
              )}
            </div>
          </div>

          {/* Mobile sticky bottom bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-slate-200 bg-white p-4 sm:hidden">
            <BackButton onClick={back} disabled={isFirstStep} fullWidth label={shell.labels.back} />
            {isLastStep ? (
              <SubmitButton onClick={submit} loading={isSubmitting} disabled={!confirmed} fullWidth label={shell.labels.submit} loadingLabel={shell.labels.submitting} />
            ) : (
              <NextButton onClick={next} fullWidth label={shell.labels.next} />
            )}
          </div>

          {/* Help line */}
          <p className="mt-5 px-1 text-center text-sm text-slate-400">
            Need a hand? Call us on{" "}
            <Link href={brand.phoneHref} className="font-semibold text-brand-purple-700">
              {brand.phone}
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
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  label: string;
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
      {label}
    </button>
  );
}

function NextButton({
  onClick,
  fullWidth,
  label,
}: {
  onClick: () => void;
  fullWidth?: boolean;
  label: string;
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
      {label}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function SubmitButton({
  onClick,
  loading,
  disabled,
  fullWidth,
  label,
  loadingLabel,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  label: string;
  loadingLabel: string;
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
          {loadingLabel}
        </>
      ) : (
        <>
          <Check className="h-5 w-5" />
          {label}
        </>
      )}
    </button>
  );
}
