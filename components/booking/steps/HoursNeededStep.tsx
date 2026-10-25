"use client";

import { useController, useFormContext } from "react-hook-form";
import { Minus, Plus } from "lucide-react";
import { StepHeading, FieldError } from "@/components/booking/primitives";

const MIN_HOURS = 2;
const STANDARD_RATE = 45; // £/hr, 1 man + large Luton van
const PREMIUM_RATE = 75; // £/hr, 2 men + large Luton van

/**
 * Man and Van is priced purely by the hour — this is the one extra question
 * the wizard needs to turn that into a real instant price at the end. Crew
 * size (1 man vs 2 men) isn't asked here; the customer picks Standard/Premium
 * on the quote page itself, same as every other service's tier choice.
 */
export function HoursNeededStep() {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name: "hoursNeeded", control });
  const hours = Number(field.value) || MIN_HOURS;

  return (
    <div>
      <StepHeading
        title="How many hours do you think you'll need?"
        subtitle="A rough estimate is fine — this sets your instant price, shown at the end."
      />
      <div className="flex items-center justify-center gap-6 rounded-2xl border-2 border-slate-200 bg-slate-50 p-8">
        <button
          type="button"
          onClick={() => field.onChange(Math.max(MIN_HOURS, hours - 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-purple-800 shadow-sm transition-colors hover:bg-brand-purple-50"
          aria-label="Fewer hours"
        >
          <Minus className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-display text-4xl font-extrabold text-brand-purple-950">{hours}</p>
          <p className="text-sm font-medium text-slate-500">hour{hours === 1 ? "" : "s"}</p>
        </div>
        <button
          type="button"
          onClick={() => field.onChange(Math.min(24, hours + 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-purple-800 shadow-sm transition-colors hover:bg-brand-purple-50"
          aria-label="More hours"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-3 text-center text-sm text-slate-500">{MIN_HOURS}-hour minimum booking.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 text-center text-sm">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="font-semibold text-slate-900">1 man + van</p>
          <p className="text-slate-500">£{STANDARD_RATE}/hr — £{STANDARD_RATE * hours} total</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="font-semibold text-slate-900">2 men + van</p>
          <p className="text-slate-500">£{PREMIUM_RATE}/hr — £{PREMIUM_RATE * hours} total</p>
        </div>
      </div>
      <FieldError message={fieldState.error?.message} />
    </div>
  );
}
