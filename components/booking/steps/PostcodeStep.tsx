"use client";

import { useController, useFormContext } from "react-hook-form";
import { Search, Loader2, CheckCircle2 } from "lucide-react";
import { usePostcodeLookup } from "@/hooks/usePostcodeLookup";
import { useWizard } from "@/components/booking/WizardContext";
import { StepHeading, FieldError } from "@/components/booking/primitives";

export function PostcodeStep({
  label,
  name,
  group,
}: {
  label: string;
  /** Postcode form field name. */
  name: string;
  /** Address-group key ("origin" | "destination"). */
  group: string;
}) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  const { setAddresses, addresses } = useWizard();
  const { lookup, loading, error } = usePostcodeLookup();
  const found = (addresses[group]?.length ?? 0) > 0;

  const onFind = async () => {
    const list = await lookup(String(field.value ?? ""));
    if (list) setAddresses(group, list);
  };

  return (
    <div>
      <StepHeading title={label} subtitle="We'll use this to find your address." />

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        Postcode
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={String(field.value ?? "")}
          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
          onBlur={field.onBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onFind();
            }
          }}
          inputMode="text"
          autoComplete="postal-code"
          placeholder="e.g. SW1A 1AA"
          className="h-12 flex-1 rounded-xl border-2 border-slate-200 px-4 text-base font-medium uppercase outline-none transition-colors placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
        />
        <button
          type="button"
          onClick={onFind}
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-purple-800 px-6 font-bold text-white transition-colors hover:bg-brand-purple-700 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          Find address
        </button>
      </div>

      <FieldError message={error ?? fieldState.error?.message} />

      {found && !error && (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-brand-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Address found — tap Continue to select it.
        </p>
      )}
    </div>
  );
}
