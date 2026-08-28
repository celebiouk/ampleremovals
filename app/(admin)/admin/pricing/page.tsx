"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, PoundSterling, Truck, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Cfg { base_callout: number; free_miles: number; per_mile: number; premium_multiplier: number }
interface Item { key: string; label: string; category: string; price: number }

export default function PricingPage() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/pricing", { cache: "no-store" });
        const j = await res.json();
        if (j.success) { setCfg(j.config); setItems(j.items); }
      } finally { setLoading(false); }
    })();
  }, []);

  const grouped = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = s ? items.filter((i) => i.label.toLowerCase().includes(s) || i.category.toLowerCase().includes(s)) : items;
    const map = new Map<string, Item[]>();
    for (const it of filtered) { if (!map.has(it.category)) map.set(it.category, []); map.get(it.category)!.push(it); }
    return Array.from(map.entries());
  }, [items, q]);

  function setItemPrice(key: string, price: number) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, price } : i)));
  }

  async function save() {
    if (!cfg) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: cfg, items: items.map((i) => ({ key: i.key, price: i.price })) }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "Couldn't save");
      toast.success("Pricing saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save pricing");
    } finally { setSaving(false); }
  }

  if (loading || !cfg) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Pricing</h1>
        <p className="text-sm text-slate-500">Standard quote = call-out + your items + mileage. Premium = Standard × the multiplier.</p>
      </div>

      {/* Config */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2"><Truck className="h-4 w-4 text-brand-purple-700" /><h2 className="font-semibold text-slate-900">Base &amp; mileage</h2></div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumField label="Base call-out £" value={cfg.base_callout} onChange={(v) => setCfg({ ...cfg, base_callout: v })} />
          <NumField label="Free miles" value={cfg.free_miles} onChange={(v) => setCfg({ ...cfg, free_miles: v })} />
          <NumField label="£ per mile" step={0.1} value={cfg.per_mile} onChange={(v) => setCfg({ ...cfg, per_mile: v })} />
          <NumField label="Premium ×" step={0.05} value={cfg.premium_multiplier} onChange={(v) => setCfg({ ...cfg, premium_multiplier: v })} icon={<Sparkles className="h-3 w-3" />} />
        </div>
      </div>

      {/* Item prices */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><PoundSterling className="h-4 w-4 text-brand-purple-700" /><h2 className="font-semibold text-slate-900">Item prices</h2></div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items…" className="h-9 w-40 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-300" />
        </div>
        <div className="space-y-4">
          {grouped.map(([category, list]) => (
            <div key={category}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{category}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {list.map((it) => (
                  <div key={it.key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{it.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-slate-400">£</span>
                      <input type="number" min={0} step={0.5} value={it.price}
                        onChange={(e) => setItemPrice(it.key, Number(e.target.value))}
                        className="h-8 w-20 rounded-md border border-slate-200 px-2 text-right text-sm outline-none focus:border-brand-purple-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky save */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl justify-end">
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand-purple-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-purple-900 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save pricing
          </button>
        </div>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, step = 1, icon }: { label: string; value: number; onChange: (v: number) => void; step?: number; icon?: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{icon}{label}</label>
      <input type="number" min={0} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400" />
    </div>
  );
}
