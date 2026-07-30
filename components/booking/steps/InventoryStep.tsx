"use client";

import { useEffect, useMemo, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { StepHeading, QuantityStepper } from "@/components/booking/primitives";
import {
  INVENTORY_CATALOG,
  type InventorySelection,
  type InventoryCategory,
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

  // Base catalog + any admin-added items (from /api/catalog), merged by category.
  const [catalog, setCatalog] = useState<InventoryCategory[]>(INVENTORY_CATALOG);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d: { success?: boolean; items?: { key: string; label: string; category: string }[] }) => {
        if (cancelled || !d.success || !d.items?.length) return;
        const merged: InventoryCategory[] = INVENTORY_CATALOG.map((c) => ({ ...c, items: [...c.items] }));
        for (const it of d.items) {
          const cat = merged.find((c) => c.category === it.category);
          if (cat) cat.items.push({ key: it.key, label: it.label });
          else merged.push({ category: it.category, items: [{ key: it.key, label: it.label }] });
        }
        setCatalog(merged);
      })
      .catch(() => { /* wizard still works without admin items */ });
    return () => { cancelled = true; };
  }, []);

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

  // "Other" — customer-typed items live in the same inventory array under a
  // unique `custom:*` key so they get a quantity stepper like everything else.
  const [customText, setCustomText] = useState("");
  const customItems = selections.filter((s) => s.key.startsWith("custom:"));
  const addCustom = () => {
    const name = customText.trim();
    if (!name) return;
    field.onChange([...selections, { key: `custom:${Date.now()}`, label: name, quantity: 1 }]);
    setCustomText("");
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
        {catalog.map((category) => (
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

      {/* Your own items (added via "Other") */}
      {customItems.length > 0 && (
        <section className="mt-7">
          <h3 className="mb-2.5 font-display text-sm font-bold uppercase tracking-wide text-slate-400">
            Your own items
          </h3>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {customItems.map((it) => (
              <div key={it.key} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium text-brand-purple-950">{it.label}</span>
                <QuantityStepper value={it.quantity} onChange={(n) => setQty(it.key, it.label, undefined, n)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Other — type your own item, then pick a quantity like the rest. */}
      <div className="mt-6 rounded-xl border-2 border-dashed border-slate-200 p-4">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Other — something not on the list?</label>
        <div className="flex gap-2">
          <input
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            placeholder="e.g. Piano, Exercise bike, Fish tank"
            className="h-11 min-w-0 flex-1 rounded-xl border-2 border-slate-200 px-3 text-base outline-none transition-colors focus:border-brand-purple-600"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customText.trim()}
            className="shrink-0 rounded-xl bg-brand-purple-800 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-purple-900 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
