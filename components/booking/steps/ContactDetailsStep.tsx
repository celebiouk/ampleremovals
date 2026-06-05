"use client";

import { useController, useFormContext } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepHeading, FieldError } from "@/components/booking/primitives";

function TextField({
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  const valid = fieldState.isTouched && !fieldState.error && field.value;

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        {...field}
        value={String(field.value ?? "")}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(
          "h-12 w-full rounded-xl border-2 px-4 text-base outline-none transition-colors focus:ring-2 focus:ring-brand-purple-100",
          fieldState.error
            ? "border-destructive focus:border-destructive"
            : valid
              ? "border-brand-green-500"
              : "border-slate-200 focus:border-brand-purple-600"
        )}
      />
      {valid && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-brand-green-600">
          <CheckCircle2 className="h-4 w-4" /> Looks good
        </p>
      )}
      <FieldError message={fieldState.error?.message} />
    </div>
  );
}

export function ContactDetailsStep() {
  return (
    <div>
      <StepHeading
        title="Your contact details"
        subtitle="We'll use these to confirm your quote and booking."
      />
      <div className="space-y-5">
        <TextField
          name="fullName"
          label="Full name"
          placeholder="Jane Smith"
          autoComplete="name"
        />
        <TextField
          name="email"
          label="Email address"
          type="email"
          placeholder="jane@example.com"
          autoComplete="email"
        />
        <TextField
          name="phone"
          label="Phone number"
          type="tel"
          placeholder="07123 456789"
          autoComplete="tel"
        />
      </div>
    </div>
  );
}
