"use client";

import { useEffect, useState, useCallback } from "react";
import { Truck, Star, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { upperName } from "@/lib/utils";

interface AnyVanJob {
  id: string; customer_name: string; phone: string; email: string | null;
  amount: number | null; job_at: string; driver_name: string | null;
  rating: number | null; rating_request_sent: boolean; created_at: string;
}

/** AnyVan Jobs — record a job + list recent ones. Mirrors the mobile screen. */
export default function AnyVanPage() {
  const [jobs, setJobs] = useState<AnyVanJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", email: "", amount: "", date: "", time: "", driver: "" });
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/anyvan-jobs", { cache: "no-store" });
      const json = await res.json();
      setJobs((json.jobs ?? []) as AnyVanJob[]);
    } catch { /* non-fatal */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.phone.trim()) { toast.error("Customer name and phone are required."); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date) || !/^\d{2}:\d{2}$/.test(f.time)) { toast.error("Enter a valid delivery date and time."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/anyvan-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: f.name.trim(), phone: f.phone.trim(),
          email: f.email.trim() || undefined,
          amount: f.amount ? Number(f.amount) : undefined,
          job_at: new Date(`${f.date}T${f.time}:00`).toISOString(),
          ...(f.driver.trim() ? { driver_name: f.driver.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || "Couldn't save");
      toast.success("AnyVan job saved — customer will be asked to rate the driver after 48h.");
      setF({ name: "", phone: "", email: "", amount: "", date: "", time: "", driver: "" });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally { setSaving(false); }
  }

  const input = "h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">AnyVan Jobs</h2>
        <p className="text-sm text-slate-500">Record an AnyVan job so we can request a driver rating afterwards.</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs font-semibold text-slate-500">Customer name</label><input className={input} value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder="Full name" /></div>
          <div><label className="mb-1 block text-xs font-semibold text-slate-500">Phone</label><input className={input} value={f.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="07…" /></div>
          <div><label className="mb-1 block text-xs font-semibold text-slate-500">Email (optional)</label><input className={input} value={f.email} onChange={(e) => set("email")(e.target.value)} placeholder="name@email.com" /></div>
          <div><label className="mb-1 block text-xs font-semibold text-slate-500">Amount £ (optional)</label><input type="number" step="0.01" className={input} value={f.amount} onChange={(e) => set("amount")(e.target.value)} placeholder="0.00" /></div>
          <div><label className="mb-1 block text-xs font-semibold text-slate-500">Delivery date</label><input type="date" className={input} value={f.date} onChange={(e) => set("date")(e.target.value)} /></div>
          <div><label className="mb-1 block text-xs font-semibold text-slate-500">Time</label><input type="time" className={input} value={f.time} onChange={(e) => set("time")(e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-xs font-semibold text-slate-500">Driver name</label><input className={input} value={f.driver} onChange={(e) => set("driver")(e.target.value)} placeholder="Who did the job" /></div>
        </div>
        <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-800 py-2.5 text-sm font-bold text-white hover:bg-brand-purple-900 disabled:opacity-50 sm:w-auto sm:px-6">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save AnyVan job
        </button>
      </form>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent AnyVan jobs</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <Truck className="mb-2 h-9 w-9 text-slate-200" /><p className="text-sm text-slate-400">No AnyVan jobs yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((j) => (
              <div key={j.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-900">{upperName(j.customer_name)}</span>
                  {j.rating != null ? (
                    <span className="flex items-center gap-1 text-sm text-slate-700"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {j.rating}/5</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{j.rating_request_sent ? "Awaiting rating" : "Scheduled"}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {j.driver_name ? `${j.driver_name} · ` : ""}{new Date(j.job_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  {j.amount != null ? ` · £${Number(j.amount).toFixed(2)}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
