/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Lightbulb } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Row { key: string; total: number; won: number; lost: number; conversion: number; value: number }
interface Insights {
  overall: { total: number; won: number; lost: number; conversion: number; value: number; avgLeadScore: number | null };
  bySource: Row[]; byDay: Row[]; byService: Row[]; headlines: string[];
}

function Table({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Not enough data yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2 font-medium">{title.replace(/^By /, "")}</th>
              <th className="pb-2 text-right font-medium">Leads</th>
              <th className="pb-2 text-right font-medium">Won</th>
              <th className="pb-2 text-right font-medium">Conv.</th>
              <th className="pb-2 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-slate-100">
                <td className="py-2 capitalize text-slate-700">{r.key}</td>
                <td className="py-2 text-right text-slate-600">{r.total}</td>
                <td className="py-2 text-right text-slate-600">{r.won}</td>
                <td className="py-2 text-right">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.conversion >= 50 ? "bg-green-100 text-green-700" : r.conversion >= 25 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{r.conversion}%</span>
                </td>
                <td className="py-2 text-right font-medium text-slate-700">{formatCurrency(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/insights").then((r) => r.json()).then((d) => { if (d.success) setData(d); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" /></div>;
  if (!data) return <p className="text-slate-500">Couldn&apos;t load insights.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><TrendingUp className="h-6 w-6 text-brand-purple-700" /> Insights</h1>
        <p className="text-sm text-slate-500">Conversion &amp; value across the last 180 days. Pure stats from your own bookings.</p>
      </div>

      {data.headlines.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="mb-2 flex items-center gap-2 font-semibold text-amber-900"><Lightbulb className="h-5 w-5" /> What stands out</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
            {data.headlines.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Leads (180d)", String(data.overall.total)],
          ["Won", String(data.overall.won)],
          ["Conversion", `${data.overall.conversion}%`],
          ["Won value", formatCurrency(data.overall.value)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Table title="By Source" rows={data.bySource} />
        <Table title="By Day" rows={data.byDay} />
        <Table title="By Service" rows={data.byService} />
      </div>
    </div>
  );
}
