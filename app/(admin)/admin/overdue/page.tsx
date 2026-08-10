"use client";

import { useEffect, useState, useCallback } from "react";
import { PackageCheck, AlertTriangle, Loader2, Phone } from "lucide-react";
import { upperName } from "@/lib/utils";

interface OverdueJob {
  id: string;
  reference: string;
  move_date: string;
  days_overdue: number;
  stage: string;
  customer: { full_name: string; phone: string } | null;
  origin: { postcode?: string; city?: string } | null;
  destination: { postcode?: string; city?: string } | null;
  drivers: string[];
}

/**
 * "Items Still Out" — jobs whose date has passed but that aren't completed yet.
 * Web mirror of the mobile screen; both call /api/admin/overdue-deliveries.
 */
export default function OverduePage() {
  const [jobs, setJobs] = useState<OverdueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overdue-deliveries", { cache: "no-store" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load");
      setJobs(json.jobs as OverdueJob[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Items Still Out</h2>
        <p className="text-sm text-slate-500">Jobs past their date that a driver hasn&apos;t marked complete — chase these up.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <PackageCheck className="mb-2 h-10 w-10 text-slate-200" />
          <p className="font-semibold text-slate-600">All delivered</p>
          <p className="text-sm text-slate-400">No jobs are past their date without being completed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <div key={j.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">{upperName(j.customer?.full_name) || "Customer"}</span>
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">{j.days_overdue}d overdue</span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-slate-400">{j.reference}</p>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> {j.stage}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {j.origin?.postcode ?? "—"}{j.destination?.postcode ? ` → ${j.destination.postcode}` : ""}
                {j.drivers.length ? ` · ${j.drivers.join(", ")}` : ""}
              </p>
              {j.customer?.phone && (
                <a href={`tel:${j.customer.phone}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-green-600 hover:underline">
                  <Phone className="h-3.5 w-3.5" /> {j.customer.phone}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
