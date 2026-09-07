"use client";

import { useEffect, useState } from "react";
import { useFormContext, useWatch, useController } from "react-hook-form";
import { Pencil, Check, Sparkles, Loader2, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { StepHeading } from "@/components/booking/primitives";
import { useWizard } from "@/components/booking/WizardContext";
import { DistancePanel } from "@/components/admin/DistancePanel";
import { TIER_COPY } from "@/lib/tiers";
import type { AddressOption } from "@/types";

const gbp0 = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n || 0);

interface QuotePreview {
  standardTotal: number;
  premiumTotal: number;
  standardDeposit: number;
  premiumDeposit: number;
  miles: number;
}

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
  // Independent prices for each package. The customer still picks Standard or
  // Premium themselves on their quote page — these just fix what each one costs
  // instead of the auto-estimate. Either or both can be left blank.
  const standardPrice = useController({ name: "standardPrice", control, defaultValue: "" });
  const premiumPrice = useController({ name: "premiumPrice", control, defaultValue: "" });

  // Live system-suggested quote (Standard + Premium), shown to the admin as
  // guidance only. The fee they actually charge is whatever they type below.
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const originPostcode = (values?.originAddress as AddressOption | undefined)?.postcode ?? null;
  const destinationPostcode = (values?.destinationAddress as AddressOption | undefined)?.postcode ?? null;
  // Stable signature of the inputs that move the price — refetch when any change.
  const previewKey = admin
    ? JSON.stringify({
        bedrooms: values?.bedrooms ?? null,
        inventory: values?.inventory ?? [],
        packingHours: values?.packingHours ?? 0,
        packingMen: values?.packingMen ?? 1,
        dismantleCount: values?.dismantleCount ?? 0,
        assembleCount: values?.assembleCount ?? 0,
        wantsEotCleaning: Boolean(values?.wantsEotCleaning),
        originPostcode,
        destinationPostcode,
      })
    : "";

  useEffect(() => {
    if (!admin || !previewKey) return;
    let cancelled = false;
    setPreviewing(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/quote/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: previewKey, // already the exact JSON payload
        });
        const data = await res.json();
        if (!cancelled && data.success) {
          setPreview({
            standardTotal: data.standardTotal,
            premiumTotal: data.premiumTotal,
            standardDeposit: data.standardDeposit,
            premiumDeposit: data.premiumDeposit,
            miles: data.miles,
          });
        }
      } catch {
        /* non-fatal — the manual price box still works without a suggestion */
      } finally {
        if (!cancelled) setPreviewing(false);
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [admin, previewKey]);

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
              {section.rows.map((row) => {
                const val = values?.[row.key];
                // Inventory renders as a numbered list, one item per line, with a
                // total count — much easier to check off than a comma run-on.
                if (row.key === "inventory" && Array.isArray(val) && val.length > 0) {
                  const items = val as { label: string; quantity: number }[];
                  const totalQty = items.reduce((n, s) => n + (Number(s.quantity) || 0), 0);
                  return (
                    <div key={row.key} className="text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <dt className="text-slate-500">{row.label}</dt>
                        <span className="rounded-full bg-brand-purple-100 px-2 py-0.5 text-xs font-semibold text-brand-purple-800">
                          {items.length} item{items.length === 1 ? "" : "s"} · {totalQty} total
                        </span>
                      </div>
                      <ol className="list-decimal space-y-0.5 pl-5 font-medium text-slate-800">
                        {items.map((s, i) => (
                          <li key={i}>{s.label}{s.quantity > 1 ? ` ×${s.quantity}` : ""}</li>
                        ))}
                      </ol>
                    </div>
                  );
                }
                return (
                  <div key={row.key} className="flex gap-3 text-sm">
                    <dt className="w-40 shrink-0 text-slate-500">{row.label}</dt>
                    <dd className="font-medium text-slate-800">{formatValue(row.key, val)}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>

      {/* Admin-only: distances to judge the job, the system-suggested quote (exactly
          what the customer would see — Standard & Premium) as guidance, then set
          BOTH prices by hand. Whatever you enter here is exactly what the customer
          sees and pays for that package — they still pick Standard or Premium
          themselves; this only fixes the price of each. */}
      {admin && (
        <div className="mt-6 space-y-3">
          <DistancePanel
            originPostcode={originPostcode ?? undefined}
            destinationPostcode={destinationPostcode ?? undefined}
          />

          {/* System-suggested quote (guidance only) */}
          <div className="rounded-xl border-2 border-brand-purple-200 bg-brand-purple-50/60 p-4">
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-purple-700" />
              <p className="text-sm font-bold text-brand-purple-900">System-suggested quote</p>
              {previewing && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-purple-400" />}
            </div>
            <p className="mb-3 text-xs text-brand-purple-700">
              This is what the customer would be quoted automatically. Use it to decide what to charge — you can match it or reduce it, for either or both packages.
            </p>
            {preview ? (
              <div className="grid grid-cols-2 gap-2">
                <Suggestion
                  label={TIER_COPY.standard.name}
                  total={preview.standardTotal}
                  deposit={preview.standardDeposit}
                  onUse={() => standardPrice.field.onChange(String(preview.standardTotal))}
                />
                <Suggestion
                  label={TIER_COPY.premium.name}
                  total={preview.premiumTotal}
                  deposit={preview.premiumDeposit}
                  onUse={() => premiumPrice.field.onChange(String(preview.premiumTotal))}
                />
              </div>
            ) : (
              <p className="text-sm text-brand-purple-400">{previewing ? "Calculating…" : "Add the items & addresses to see a suggestion."}</p>
            )}
          </div>

          {/* The fees actually charged — one box per package. The customer picks
              which one they want on their own quote page, same as always. */}
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
            <label className="block text-sm font-bold text-amber-900">Set the quote prices (admin)</label>
            <p className="mt-0.5 text-xs text-amber-700">
              Whatever you enter here is exactly what the customer sees and pays for that package. Leave either blank to use its auto-estimate. The customer still chooses which package to book.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-600"><Truck className="h-3.5 w-3.5" /> Standard</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    inputMode="decimal"
                    value={(standardPrice.field.value as string) ?? ""}
                    onChange={(e) => standardPrice.field.onChange(e.target.value)}
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border-2 border-amber-300 bg-white pl-7 pr-3 text-base outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-600"><Sparkles className="h-3.5 w-3.5" /> Premium</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    inputMode="decimal"
                    value={(premiumPrice.field.value as string) ?? ""}
                    onChange={(e) => premiumPrice.field.onChange(e.target.value)}
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border-2 border-amber-300 bg-white pl-7 pr-3 text-base outline-none focus:border-amber-500"
                  />
                </div>
              </div>
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

/** One suggested-tier card in the admin quote panel. "Use this" copies the figure
 *  into the fee box (and selects the tier) — the admin can then keep or reduce it. */
function Suggestion({
  label, total, deposit, onUse,
}: {
  label: string;
  total: number;
  deposit: number;
  onUse: () => void;
}) {
  return (
    <div className="rounded-xl border border-brand-purple-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-purple-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-brand-purple-900">{gbp0(total)}</p>
      <p className="text-xs text-slate-400">25% deposit {gbp0(deposit)}</p>
      <button
        type="button"
        onClick={onUse}
        className="mt-2 w-full rounded-lg border border-brand-purple-300 bg-brand-purple-50 px-2 py-1.5 text-xs font-semibold text-brand-purple-800 hover:bg-brand-purple-100"
      >
        Use this price
      </button>
    </div>
  );
}
