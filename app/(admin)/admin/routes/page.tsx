/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Route, MapPin, Clock, Coffee, RefreshCw } from "lucide-react";
import { toast } from "sonner";

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function RoutesPage() {
  const [date, setDate] = useState(tomorrowISO());
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/routes?date=${date}`);
      const data = await res.json();
      if (data.success) setPlans(data.plans);
    } finally {
      setLoading(false);
    }
  }, [date]);
  useEffect(() => { load(); }, [load]);

  async function build() {
    setBuilding(true);
    try {
      const res = await fetch("/api/admin/routes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date }) });
      const data = await res.json();
      if (data.success) { toast.success(`Built ${data.driversPlanned} route(s)`); load(); }
      else toast.error("Failed to build routes");
    } finally {
      setBuilding(false);
    }
  }

  const driverName = (d: any) => d?.preferred_name || [d?.first_name, d?.last_name].filter(Boolean).join(" ") || "Driver";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Route className="h-6 w-6 text-brand-purple-700" /> Route Plans</h1>
          <p className="text-sm text-slate-500">Optimised stop sequence per driver (nearest-neighbour + target times).</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <button onClick={build} disabled={building} className="flex items-center gap-2 rounded-lg bg-brand-purple-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Build routes
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" /></div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
          No route plans for this date. Click <strong>Build routes</strong> to generate them from confirmed jobs.
        </div>
      ) : (
        <div className="space-y-5">
          {plans.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{driverName(p.driver)}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Start {p.recommended_start}</span>
                  <span>{p.total_stops} stops</span>
                  <span>{p.total_miles} mi</span>
                </div>
              </div>
              <ol className="space-y-2">
                {(p.stops ?? []).map((s: any, i: number) => (
                  <li key={i} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${s.isBreak ? "border-amber-200 bg-amber-50" : "border-slate-100 bg-slate-50"}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.isBreak ? "bg-amber-200 text-amber-800" : "bg-brand-purple-100 text-brand-purple-700"}`}>
                      {s.isBreak ? <Coffee className="h-3.5 w-3.5" /> : s.seq}
                    </span>
                    {s.isBreak ? (
                      <span className="text-sm font-medium text-amber-800">Break — {s.targetArrival}–{s.targetCompletion}</span>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-mono text-sm font-semibold text-slate-800">{s.reference}</p>
                          <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" /> {s.postcode || "—"} · {s.travelMiles} mi travel</p>
                        </div>
                        <span className="text-sm text-slate-600">{s.targetArrival}–{s.targetCompletion}</span>
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
