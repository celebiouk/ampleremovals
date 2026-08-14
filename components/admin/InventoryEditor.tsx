"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Minus, X, Loader2, Search, PackagePlus, Check } from "lucide-react";
import { toast } from "sonner";
import { INVENTORY_CATALOG, type InventorySelection, type InventoryCategory } from "@/lib/inventory-catalog";

/** A single addable option (a catalog item, or one of its variants). */
interface AddOption { key: string; label: string; variant?: string; category: string }

/**
 * Admin editor for a booking's item list. Works at any stage — including after
 * the survey is "complete" — so admin can add items the customer later remembers.
 * Persists to bookings.inventory via PATCH /api/admin/bookings/[id]/inventory.
 */
export function InventoryEditor({ bookingId, initial }: { bookingId: string; initial: InventorySelection[] }) {
  const [items, setItems] = useState<InventorySelection[]>(initial ?? []);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<InventoryCategory[]>(INVENTORY_CATALOG);
  const [search, setSearch] = useState("");
  const [customText, setCustomText] = useState("");

  // Base catalog + admin-added items, merged by category (mirrors the wizard).
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
      .catch(() => { /* editor still works with the built-in catalog */ });
    return () => { cancelled = true; };
  }, []);

  const totalItems = items.reduce((n, s) => n + (s.quantity || 0), 0);

  const qtyOf = (key: string, variant?: string) =>
    items.find((s) => s.key === key && s.variant === variant)?.quantity ?? 0;

  const setQty = (key: string, label: string, variant: string | undefined, quantity: number) => {
    setItems((prev) => {
      const rest = prev.filter((s) => !(s.key === key && s.variant === variant));
      return quantity > 0 ? [...rest, { key, label, variant, quantity }] : rest;
    });
  };
  const bump = (key: string, label: string, variant: string | undefined, delta: number) =>
    setQty(key, label, variant, Math.max(0, qtyOf(key, variant) + delta));

  const addCustom = () => {
    const name = customText.trim();
    if (!name) return;
    setItems((prev) => [...prev, { key: `custom:${Date.now()}`, label: name, quantity: 1 }]);
    setCustomText("");
  };

  // Flatten the catalog into addable options (one row per variant), filtered.
  const options = useMemo<AddOption[]>(() => {
    const out: AddOption[] = [];
    for (const cat of catalog) {
      for (const it of cat.items) {
        if (it.variants?.length) {
          for (const v of it.variants) out.push({ key: it.key, label: `${it.label} — ${v.label}`, variant: v.key, category: cat.category });
        } else {
          out.push({ key: it.key, label: it.label, category: cat.category });
        }
      }
    }
    const q = search.trim().toLowerCase();
    return q ? out.filter((o) => o.label.toLowerCase().includes(q) || o.category.toLowerCase().includes(q)) : out;
  }, [catalog, search]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/inventory`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory: items }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Couldn't save");
      setItems(json.inventory as InventorySelection[]);
      setEditing(false);
      toast.success("Inventory updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save the inventory");
    } finally { setSaving(false); }
  }

  function cancel() {
    setItems(initial ?? []);
    setEditing(false);
    setSearch(""); setCustomText("");
  }

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">{totalItems} item{totalItems === 1 ? "" : "s"} · {items.length} line{items.length === 1 ? "" : "s"}</span>
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-lg bg-brand-purple-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-purple-900">
            <PackagePlus className="h-3.5 w-3.5" /> {items.length ? "Edit items" : "Add items"}
          </button>
        </div>
        {items.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">No items recorded yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
            {items.map((it, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5">
                <span className="text-slate-700">{it.label}</span>
                <span className="font-semibold text-brand-purple-800">×{it.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Current items */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Current items</p>
        {items.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-3 text-center text-sm text-slate-400">No items yet — add some below.</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li key={`${it.key}:${it.variant ?? ""}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-1.5">
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{it.label}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => bump(it.key, it.label, it.variant, -1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-6 text-center text-sm font-semibold text-slate-800">{it.quantity}</span>
                  <button onClick={() => bump(it.key, it.label, it.variant, 1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setQty(it.key, it.label, it.variant, 0)} className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add a custom item */}
      <div className="flex items-center gap-2">
        <input
          value={customText} onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder="Add a custom item (e.g. Piano)…"
          className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-300"
        />
        <button onClick={addCustom} disabled={!customText.trim()} className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Add from catalog */}
      <div>
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the item catalog…"
            className="h-9 w-full rounded-lg border border-slate-200 pl-8 pr-3 text-sm outline-none focus:border-brand-purple-300" />
        </div>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-100">
          {options.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">No matching items</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {options.map((o) => {
                const n = qtyOf(o.key, o.variant);
                return (
                  <li key={`${o.key}:${o.variant ?? ""}`} className="flex items-center justify-between gap-2 px-3 py-1.5">
                    <div className="min-w-0">
                      <span className="block truncate text-sm text-slate-700">{o.label}</span>
                      <span className="text-[10px] uppercase tracking-wide text-slate-400">{o.category}</span>
                    </div>
                    {n > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => bump(o.key, o.label, o.variant, -1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-5 text-center text-sm font-semibold text-brand-purple-800">{n}</span>
                        <button onClick={() => bump(o.key, o.label, o.variant, 1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => bump(o.key, o.label, o.variant, 1)} className="flex items-center gap-1 rounded-lg border border-brand-purple-200 px-2.5 py-1 text-xs font-semibold text-brand-purple-700 hover:bg-brand-purple-50">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <span className="mr-auto text-xs text-slate-400">{totalItems} item{totalItems === 1 ? "" : "s"} total</span>
        <button onClick={cancel} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand-purple-800 px-4 py-2 text-sm font-bold text-white hover:bg-brand-purple-900 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save changes
        </button>
      </div>
    </div>
  );
}
