"use client";

import { useController, useFormContext } from "react-hook-form";
import { StepHeading, FieldError } from "@/components/booking/primitives";
import { cn } from "@/lib/utils";

const MIN = 20;

export function DescriptionStep() {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name: "description", control });
  const value = String(field.value ?? "");

  return (
    <div>
      <StepHeading
        title="Tell us more about your move"
        subtitle="The more detail you give, the more accurate your quote."
      />
      <textarea
        value={value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        rows={5}
        placeholder="Describe what you need help with — the more detail the better. For example: number of items, any large or fragile pieces, access issues, parking situation, floor number etc."
        className={cn(
          "min-h-[120px] w-full resize-y rounded-xl border-2 px-4 py-3 text-base leading-relaxed outline-none transition-colors focus:ring-2 focus:ring-brand-purple-100",
          fieldState.error
            ? "border-destructive focus:border-destructive"
            : "border-slate-200 focus:border-brand-purple-600"
        )}
      />
      <div className="mt-2 flex items-center justify-between">
        <FieldError message={fieldState.error?.message} />
        <span
          className={cn(
            "ml-auto text-sm font-medium",
            value.trim().length >= MIN ? "text-brand-green-600" : "text-slate-400"
          )}
        >
          {value.trim().length} / {MIN} min
        </span>
      </div>
    </div>
  );
}
