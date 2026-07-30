"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Package, Loader2, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INVENTORY_CATALOG } from "@/lib/inventory-catalog";

interface CatalogItem {
  id: string;
  label: string;
  category: string;
  active: boolean;
  created_at: string;
}

const BASE_CATEGORIES = INVENTORY_CATALOG.map((c) => c.category);

/**
 * Admin "Item catalog" — add/hide/remove the extra inventory items that show in
 * the booking wizard alongside the built-in list. Built-in items can't be edited
 * here (they're shown for reference).
 */
export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("More items");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalog");
      const data = await res.json();
      if (data.success) setItems(data.items as CatalogItem[]);
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), category: category.trim() || "More items" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to add");
      toast.success(`Added "${label.trim()}"`);
      setLabel("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (it: CatalogItem) => {
    await fetch(`/api/admin/catalog/${it.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !it.active }),
    });
    load();
  };

  const remove = async (it: CatalogItem) => {
    await fetch(`/api/admin/catalog/${it.id}`, { method: "DELETE" });
    toast.success(`Removed "${it.label}"`);
    load();
  };

  // Group admin items by category for display.
  const grouped = items.reduce<Record<string, CatalogItem[]>>((acc, it) => {
    (acc[it.category] ??= []).push(it);
    return acc;
  }, {});
  const allCategories = Array.from(new Set([...BASE_CATEGORIES, ...items.map((i) => i.category), "More items"]));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple-800 text-white">
          <Package className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-purple-950">Item catalog</h1>
          <p className="text-sm text-slate-500">Add items customers can choose in the booking form.</p>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={add} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Item name</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Treadmill"
              className="h-11 w-full rounded-xl border-2 border-slate-200 px-3 text-base outline-none focus:border-brand-purple-600"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category</label>
            <input
              list="catalog-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
              className="h-11 w-full rounded-xl border-2 border-slate-200 px-3 text-base outline-none focus:border-brand-purple-600"
            />
            <datalist id="catalog-categories">
              {allCategories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>
        <Button type="submit" disabled={!label.trim() || adding} className="mt-4 w-full bg-brand-purple-800 hover:bg-brand-purple-900 sm:w-auto">
          {adding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…</> : <><Plus className="mr-1.5 h-4 w-4" /> Add item</>}
        </Button>
      </form>

      {/* Admin-added items */}
      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-slate-400">Your added items</h2>
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
          No custom items yet. Add one above and it appears in the booking form straight away.
        </p>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <p className="mb-1.5 text-sm font-bold text-brand-purple-800">{cat}</p>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {list.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className={`text-sm ${it.active ? "text-slate-800" : "text-slate-400 line-through"}`}>{it.label}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggle(it)} title={it.active ? "Hide from booking form" : "Show in booking form"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        {it.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button onClick={() => remove(it)} title="Remove"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Built-in reference */}
      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-slate-400">Built-in items (always shown)</h2>
      <div className="space-y-3">
        {INVENTORY_CATALOG.map((c) => (
          <div key={c.category} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="mb-1 text-sm font-bold text-slate-500">{c.category}</p>
            <p className="text-sm text-slate-500">{c.items.map((i) => i.label).join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
