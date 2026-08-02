"use client";

import { useFormContext, useWatch, useController } from "react-hook-form";
import { Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { StepHeading } from "@/components/booking/primitives";
import { useWizard } from "@/components/booking/WizardContext";
import { DistancePanel } from "@/components/admin/DistancePanel";
import type { AddressOption } from "@/types";

export interface ReviewSection {
  title: string;
  editStep: number;
  rows: { label: string; key: string }[];
}

const LABELS: Record<string, string> = {
  domestic: "Domestic",
  business: "Business",
  flat: "Flat",
  house: "House",
  bungalow: "Bungalow",
  studio: "Studio",
  small: "Small van",
  medium: "Medium van",
  large: "Large van",
  full: "Full clearance",
  partial: "Partial clearance",
  single_room: "Single room",
  regular: "Regular clean",
  deep: "Deep clean",
  one_off: "One-off",
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  morning: "Morning (8am – 12pm)",
  afternoon: "Afternoon (12pm – 5pm)",
};

function humanize(v: string): string {
  return LABELS[v] ?? v.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function isAddress(v: unknown): v is AddressOption {
  return typeof v === "object" && v !== null && "line_1" in v;
}

/** Unit suffix for the quantity-based add-on fields. */
const QUANTITY_UNITS: Record<string, string> = {
  packingHours: "hour",
  dismantleCount: "item",
  assembleCount: "item",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatValue(key: string, value: any): string {
  if (key in QUANTITY_UNITS) {
    const n = Number(value) || 0;
    if (n <= 0) return "—";
    return `${n} ${QUANTITY_UNITS[key]}${n === 1 ? "" : "s"}`;
  }
  if (value === undefined || value === null || value === "") return "—";
  if (value instanceof Date) return formatDate(value);
  if (isAddress(value)) {
    return [value.line_1, value.line_2, value.city, value.postcode]
      .filter(Boolean)
      .join(", ");
  }
  if (key === "additionalServices" && typeof value === "object") {
    const on = Object.entries(value)
      .filter(([, v]) => v)
      .map(([k]) => humanize(k));
    return on.length ? on.join(", ") : "None";
  }
  // Inventory: array of { label, quantity } selections.
  if (key === "inventory" && Array.isArray(value)) {
    if (!value.length) return "None added";
    return value
      .map((s) => `${s.label}${s.quantity > 1 ? ` ×${s.quantity}` : ""}`)
      .join(", ");
  }
  if (Array.isArray(value)) return value.length ? value.join(", ") : "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return humanize(String(value));
}

export function ReviewStep({ sections }: { sections: ReviewSection[] }) {
  const { control } = useFormContext();
  const values = useWatch({ control });
  const { goToStep, admin } = useWizard();
  const confirm = useController({ name: "confirmed", control });
  const adminPrice = useController({ name: "adminPrice", control, defaultValue: "" });

  return (
    <div>
      <StepHeading
        title="Review your details"
        subtitle="Please check everything is correct before submitting."
      />

      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-brand-purple-800">
                {section.title}
              </h3>
              <button
                type="button"
                onClick={() => goToStep(section.editStep)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-purple-700 hover:underline"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
            <dl className="space-y-1.5">
              {section.rows.map((row) => (
                <div key={row.key} className="flex gap-3 text-sm">
                  <dt className="w-40 shrink-0 text-slate-500">{row.label}</dt>
                  <dd className="font-medium text-slate-800">
                    {formatValue(row.key, values?.[row.key])}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {/* Admin-only: distances first (office → pickup, pickup → dropoff) so you can
          judge the job, then set the quote price by hand. This exact figure is what
          gets emailed to the customer as their quote — no auto-estimate. */}
      {admin && (
        <div className="mt-6 space-y-3">
          <DistancePanel
            originPostcode={(values?.originAddress as AddressOption | undefined)?.postcode}
            destinationPostcode={(values?.destinationAddress as AddressOption | undefined)?.postcode}
          />
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <label className="block text-sm font-bold text-amber-900">Set the quote price (admin)</label>
          <p className="mt-0.5 text-xs text-amber-700">
            Whatever you enter here is emailed to the customer as their quote. Leave blank to use the auto-estimate.
          </p>
          <div className="relative mt-3 max-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={(adminPrice.field.value as string) ?? ""}
              onChange={(e) => adminPrice.field.onChange(e.target.value)}
              placeholder="0.00"
              className="h-11 w-full rounded-xl border-2 border-amber-300 bg-white pl-7 pr-3 text-base outline-none focus:border-amber-500"
            />
          </div>
          </div>
        </div>
      )}

      {/* Confirm checkbox */}
      <button
        type="button"
        onClick={() => confirm.field.onChange(!confirm.field.value)}
        className={cn(
          "mt-6 flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all",
          confirm.field.value
            ? "border-brand-green-600 bg-brand-green-50"
            : "border-slate-200 hover:border-brand-purple-300"
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all",
            confirm.field.value
              ? "border-brand-green-600 bg-brand-green-600 text-white"
              : "border-slate-300 text-transparent"
          )}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
        <span className="text-sm font-medium text-slate-700">
          I confirm the details above are correct.
        </span>
      </button>
    </div>
  );
}
