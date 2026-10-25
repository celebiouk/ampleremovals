"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, Loader2, Package, StepForward, Footprints, Ellipsis, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { INVENTORY_CATALOG } from "@/lib/inventory-catalog";
import { calcAutoAmount, type ExtraChargeRates, type ExtraType } from "@/lib/extra-charge-pricing";

const TYPE_OPTIONS: { type: ExtraType; label: string; hint: string; icon: typeof Package }[] = [
  { type: "item", label: "Extra item", hint: "Wasn't in the original list", icon: Package },
  { type: "stairs", label: "Extra stairs", hint: "Flights beyond ground access", icon: StepForward },
  { type: "distance", label: "Long carry", hint: "More than the free allowance", icon: Footprints },
  { type: "other", label: "Other", hint: "Describe it yourself", icon: Ellipsis },
];

const FLAT_ITEMS = INVENTORY_CATALOG.flatMap((c) => c.items.map((i) => ({ key: i.key, label: i.label })));

/**
 * Web driver portal's version of driver-app's JobExtraButton — same backend
 * (/api/drivers/jobs/[bookingId]/charges, admin-approval gated), same
 * item/stairs/distance/other picker, here built with the full real catalog
 * since this isn't Metro-scoped like the native app.
 */
export function AddExtraChargeButton({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [rates, setRates] = useState<ExtraChargeRates | null>(null);
  const [extraType, setExtraType] = useState<ExtraType | null>(null);
  const [search, setSearch] = useState("");
  const [itemKey, setItemKey] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [flights, setFlights] = useState("");
  const [distance, setDistance] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setExtraType(null); setSearch(""); setItemKey(null); setQuantity(1);
    setFlights(""); setDistance(""); setDesc(""); setAmount(""); setAmountTouched(false);
    fetch("/api/drivers/extra-rates").then((r) => r.json()).then((j) => setRates(j.rates)).catch(() => {});
  }, [open]);

  const itemLabel = itemKey ? FLAT_ITEMS.find((i) => i.key === itemKey)?.label ?? null : null;
  const filteredItems = useMemo(
    () => (search.trim() ? FLAT_ITEMS.filter((i) => i.label.toLowerCase().includes(search.trim().toLowerCase())) : FLAT_ITEMS),
    [search]
  );

  const autoAmount = rates && extraType
    ? calcAutoAmount({ extraType, quantity, flights: Number(flights) || 0, distanceMeters: Number(distance) || 0 }, rates)
    : 0;
  const displayAmount = amountTouched ? amount : (extraType && extraType !== "other" ? String(autoAmount) : amount);
  const amt = parseFloat(displayAmount);

  const canSubmit =
    Number.isFinite(amt) && amt >= 0 &&
    (extraType === "item" ? !!itemKey :
     extraType === "stairs" ? Number(flights) > 0 :
     extraType === "distance" ? Number(distance) > 0 :
     extraType === "other" ? desc.trim().length > 0 : false);

  async function submit() {
    if (!extraType || !canSubmit) { toast.error("Fill in the details first"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/drivers/jobs/${bookingId}/charges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraType, amount: amt,
          ...(extraType === "item" ? { itemKey, itemLabel, quantity } : {}),
          ...(extraType === "stairs" ? { flights: Number(flights) } : {}),
          ...(extraType === "distance" ? { distanceMeters: Number(distance) } : {}),
          ...(extraType === "other" ? { description: desc.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Extra added", { description: "Sent to the office to approve." });
        setOpen(false);
      } else {
        toast.error(data.error || "Couldn't add the extra");
      }
    } catch {
      toast.error("Couldn't add the extra");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
          <Plus className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900">Add extra charge</div>
          <div className="text-xs text-slate-500">Extra item, stairs, long carry…</div>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
          <div className="flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add extra charge</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {!extraType ? (
                <div className="space-y-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button key={opt.type} onClick={() => setExtraType(opt.type)}
                      className="flex w-full items-center gap-3 rounded-xl border-2 border-slate-200 p-3 text-left hover:border-brand-purple-300 hover:bg-brand-purple-50">
                      <opt.icon className="h-5 w-5 text-brand-purple-700" />
                      <div>
                        <p className="font-semibold text-slate-900">{opt.label}</p>
                        <p className="text-xs text-slate-500">{opt.hint}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <button onClick={() => setExtraType(null)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>

                  {extraType === "item" && (
                    !itemKey ? (
                      <div>
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items…"
                          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20" />
                        <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-100">
                          {filteredItems.slice(0, 40).map((i) => (
                            <button key={i.key} onClick={() => setItemKey(i.key)}
                              className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 last:border-0 hover:bg-slate-50">
                              {i.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border-2 border-brand-purple-300 p-3">
                        <div>
                          <p className="font-semibold text-slate-900">{itemLabel}</p>
                          <button onClick={() => setItemKey(null)} className="text-xs font-semibold text-brand-purple-700">Change item</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-8 w-8 rounded-full bg-slate-100 font-bold text-slate-700 hover:bg-slate-200">−</button>
                          <span className="w-5 text-center font-semibold">{quantity}</span>
                          <button onClick={() => setQuantity((q) => q + 1)} className="h-8 w-8 rounded-full bg-slate-100 font-bold text-slate-700 hover:bg-slate-200">+</button>
                        </div>
                      </div>
                    )
                  )}

                  {extraType === "stairs" && (
                    <input type="number" min="0" step="1" value={flights} onChange={(e) => setFlights(e.target.value)} placeholder="Extra flights of stairs"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20" />
                  )}

                  {extraType === "distance" && (
                    <div>
                      <input type="number" min="0" step="1" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="Total carry distance (metres)"
                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20" />
                      {rates && <p className="mt-1 text-xs text-slate-500">First {rates.distanceFreeMeters}m is free — only the extra gets charged.</p>}
                    </div>
                  )}

                  {extraType === "other" && (
                    <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What's the charge for?"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20" />
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      {extraType === "other" ? "Amount (£)" : "Suggested price — edit if needed (£)"}
                    </label>
                    <input type="number" min="0" step="0.01" value={displayAmount}
                      onChange={(e) => { setAmount(e.target.value); setAmountTouched(true); }}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20" />
                  </div>
                </div>
              )}
            </div>

            {extraType && (
              <div className="mt-4 flex gap-3">
                <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={submit} disabled={!canSubmit || saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-purple-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-purple-800 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
