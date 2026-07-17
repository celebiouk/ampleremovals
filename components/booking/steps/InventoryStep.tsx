"use client";

import { useMemo } from "react";
import { useController, useFormContext } from "react-hook-form";
import { StepHeading, QuantityStepper } from "@/components/booking/primitives";
import {
  INVENTORY_CATALOG,
  type InventorySelection,
} from "@/lib/inventory-catalog";

/**
 * Item template — "what are you moving?". Designed to feel fast: quiet rows with
 * a single tap-to-add control that only expands to a −/+ counter once selected,
 * so nothing looks like a form to fill in. Everything is optional.
 *
 * Selections are stored on the `inventory` field as InventorySelection[]:
 *   { key: item.key, label: display label, variant?: variant.key, quantity }
 */
export function InventoryStep() {
  const { control } = useFormContext();
  const { field } = useController({ name: "inventory", control });
  const selections: InventorySelection[] = Array.isArray(field.value) ? field.value : [];

  const totalItems = useMemo(
    () => selections.reduce((sum, s) => sum + (s.quantity || 0), 0),
    [selections]
  );

  const qtyOf = (itemKey: string, variantKey?: string): number =>
    selections.find((s) => s.key === itemKey && s.variant === variantKey)?.quantity ?? 0;

  const setQty = (
    itemKey: string,
    label: string,
    variantKey: string | undefined,
    quantity: number
  ) => {
    const rest = selections.filter(
      (s) => !(s.key === itemKey && s.variant === variantKey)
    );
    field.onChange(
      quantity > 0
        ? [...rest, { key: itemKey, label, variant: variantKey, quantity }]
        : rest
    );
  };

  return (
    <div>
      <StepHeading
        title="What are you moving?"
        subtitle="Tap ＋ on anything you're bringing. It's fine to guess — you can tell us more later."
      />

      {/* Running total — reassures without nagging. */}
      <div className="mb-5 flex items-center justify-between rounded-xl border border-brand-purple-100 bg-brand-purple-50/60 px-4 py-3">
        <span className="text-sm font-medium text-brand-purple-900">
          {totalItems === 0 ? "Nothing added yet" : `${totalItems} item${totalItems === 1 ? "" : "s"} added`}
        </span>
        {totalItems > 0 && (
          <button
            type="button"
            onClick={() => field.onChange([])}
            className="text-sm font-semibold text-brand-purple-700 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-7">
        {INVENTORY_CATALOG.map((category) => (
          <section key={category.category}>
            <h3 className="mb-2.5 font-display text-sm font-bold uppercase tracking-wide text-slate-400">
              {category.category}
            </h3>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {category.items.map((item) =>
                item.variants ? (
                  // Item with sub-types: label header + a quiet row per variant.
                  <div key={item.key} className="px-4 py-3">
                    <p className="mb-2 text-sm font-semibold text-brand-purple-950">
                      {item.label}
                    </p>
                    <div className="space-y-1.5">
                      {item.variants.map((v) => (
                        <div
                          key={v.key}
                          className="flex items-center justify-between gap-3 pl-1"
                        >
                          <span className="text-sm text-slate-600">{v.label}</span>
                          <QuantityStepper
                            value={qtyOf(item.key, v.key)}
                            onChange={(n) =>
                              setQty(item.key, `${item.label} — ${v.label}`, v.key, n)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Simple item: one row.
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-brand-purple-950">
                      {item.label}
                    </span>
                    <QuantityStepper
                      value={qtyOf(item.key, undefined)}
                      onChange={(n) => setQty(item.key, item.label, undefined, n)}
                    />
                  </div>
                )
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
