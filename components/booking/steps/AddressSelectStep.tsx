"use client";

import { useEffect, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizard } from "@/components/booking/WizardContext";
import { StepHeading, FieldError } from "@/components/booking/primitives";
import type { AddressOption } from "@/types";

export function AddressSelectStep({
  label,
  name,
  group,
}: {
  label: string;
  /** Address form field name. */
  name: string;
  group: string;
}) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  const { addresses } = useWizard();
  const list = addresses[group] ?? [];
  const existing = field.value as AddressOption | undefined;

  const [showAll, setShowAll] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(
    list.length === 1 ? 0 : null
  );
  const [line1, setLine1] = useState(existing?.line_1 ?? "");
  const [line2, setLine2] = useState(existing?.line_2 ?? "");

  const commit = (idx: number | null, l1: string, l2: string) => {
    if (idx == null || !list[idx]) {
      field.onChange(undefined);
      return;
    }
    const opt = list[idx];
    field.onChange({
      line_1: l1.trim(),
      line_2: (l2.trim() || opt.line_2) || undefined,
      city: opt.city,
      postcode: opt.postcode,
    } satisfies AddressOption);
  };

  // Auto-select when exactly one option is returned.
  useEffect(() => {
    if (list.length === 1) commit(0, line1, line2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  if (list.length === 0) {
    return (
      <div>
        <StepHeading title={label} />
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          No addresses found for this postcode. Please go back and try again.
        </div>
      </div>
    );
  }

  const visible = showAll ? list : list.slice(0, 8);

  return (
    <div>
      <StepHeading
        title={label}
        subtitle="Choose the area, then add your building number/name and street."
      />

      <div className="space-y-2.5">
        {visible.map((opt, idx) => {
          const selected = selectedIdx === idx;
          const summary = [opt.line_2, opt.city, opt.postcode]
            .filter(Boolean)
            .join(", ");
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedIdx(idx);
                commit(idx, line1, line2);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border-2 bg-white p-4 text-left transition-all duration-150 hover:border-brand-purple-300",
                selected
                  ? "border-brand-purple-600 bg-brand-purple-50 shadow-sm"
                  : "border-slate-200"
              )}
            >
              <MapPin
                className={cn(
                  "h-5 w-5 shrink-0",
                  selected ? "text-brand-purple-700" : "text-slate-400"
                )}
              />
              <span className="flex-1 text-sm font-medium text-slate-700">
                {summary || opt.postcode}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                  selected
                    ? "border-brand-green-600 bg-brand-green-600 text-white"
                    : "border-slate-300 text-transparent"
                )}
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>

      {list.length > 8 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-3 text-sm font-semibold text-brand-purple-700 hover:underline"
        >
          {showAll ? "Show fewer" : `Show ${list.length - 8} more`}
        </button>
      )}

      {/* Manual address lines */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Building number / name &amp; street
          </label>
          <input
            value={line1}
            onChange={(e) => {
              setLine1(e.target.value);
              commit(selectedIdx, e.target.value, line2);
            }}
            placeholder="e.g. 12 Oak Avenue"
            className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Address line 2{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            value={line2}
            onChange={(e) => {
              setLine2(e.target.value);
              commit(selectedIdx, line1, e.target.value);
            }}
            placeholder="Flat, building, etc."
            className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
          />
        </div>
      </div>

      <FieldError
        message={
          // Surface the nested line_1 error from the address object.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (fieldState.error as any)?.line_1?.message ?? fieldState.error?.message
        }
      />
    </div>
  );
}
