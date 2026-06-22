"use client";

import { useController, useFormContext } from "react-hook-form";
import { Sparkles, Check } from "lucide-react";
import { StepHeading } from "@/components/booking/primitives";
import { cn } from "@/lib/utils";

/**
 * Cross-sell: offer end-of-tenancy cleaning at 30% off to customers booking a
 * removal / man-and-van / house-clearance. Sets the `wantsEotCleaning` boolean.
 */
export function CleaningUpsellStep() {
  const { control } = useFormContext();
  const { field } = useController({ name: "wantsEotCleaning", control, defaultValue: false });
  const selected = Boolean(field.value);

  const Option = ({ value, title, subtitle }: { value: boolean; title: string; subtitle: string }) => {
    const active = selected === value;
    return (
      <button
        type="button"
        onClick={() => field.onChange(value)}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors",
          active ? "border-brand-green-500 bg-brand-green-50" : "border-slate-200 hover:border-brand-purple-300"
        )}
      >
        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", active ? "border-brand-green-500 bg-brand-green-500" : "border-slate-300")}>
          {active && <Check className="h-4 w-4 text-white" />}
        </span>
        <span>
          <span className="block font-semibold text-slate-900">{title}</span>
          <span className="block text-sm text-slate-500">{subtitle}</span>
        </span>
      </button>
    );
  };

  return (
    <div>
      <StepHeading
        title="Need your place cleaned too?"
        subtitle="Most people moving out also need an end-of-tenancy clean to get their deposit back."
      />

      <div className="mb-5 rounded-2xl border-2 border-brand-green-200 bg-gradient-to-br from-brand-green-50 to-white p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-green-600" />
          <span className="rounded-full bg-brand-green-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Save 30%</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          Add our professional <strong>End of Tenancy Cleaning</strong> to this booking and get{" "}
          <strong className="text-brand-green-700">30% off</strong> the cleaning — only when booked together with your move.
        </p>
      </div>

      <div className="space-y-3">
        <Option value={true} title="Yes, add cleaning (30% off)" subtitle="We'll include a discounted end-of-tenancy clean in your quote." />
        <Option value={false} title="No thanks" subtitle="Just the service I came for." />
      </div>
    </div>
  );
}
