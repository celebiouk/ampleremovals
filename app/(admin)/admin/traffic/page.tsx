"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/admin/AdminSkeleton";

interface PageViewRow { path: string; session_id: string; created_at: string }

function monthOptions(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) });
  }
  return out;
}

export default function AdminTrafficPage() {
  const months = monthOptions();
  const [month, setMonth] = useState(months[0].key);
  const [rows, setRows] = useState<PageViewRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const [y, m] = month.split("-").map(Number);
    const from = new Date(y, m - 1, 1).toISOString();
    const to = new Date(y, m, 1).toISOString();
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("page_views")
      .select("path, session_id, created_at")
      .gte("created_at", from)
      .lt("created_at", to)
      .order("created_at", { ascending: true })
      .limit(50000);
    if (fetchError) {
      setError(fetchError.message);
      setRows([]);
    } else {
      setRows((data ?? []) as PageViewRow[]);
    }
    setIsLoading(false);
  }, [month]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalViews = rows.length;
  const uniqueSessions = new Set(rows.map((r) => r.session_id)).size;

  const byPage = Object.entries(
    rows.reduce((acc, r) => {
      if (!acc[r.path]) acc[r.path] = { views: 0, sessions: new Set<string>() };
      acc[r.path].views += 1;
      acc[r.path].sessions.add(r.session_id);
      return acc;
    }, {} as Record<string, { views: number; sessions: Set<string> }>)
  )
    .map(([path, v]) => ({ path, views: v.views, sessions: v.sessions.size }))
    .sort((a, b) => b.views - a.views);

  const byDay = Object.entries(
    rows.reduce((acc, r) => {
      const day = r.created_at.slice(0, 10);
      acc[day] = (acc[day] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([date, count]) => ({ date: date.slice(8, 10), count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Traffic</h1>
          <p className="text-sm text-slate-500">Site-wide and per-page views, by month.</p>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium"
        >
          {months.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          Couldn&apos;t load traffic data: {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-72 sm:col-span-2" />
          <Skeleton className="h-96 sm:col-span-2" />
        </div>
      ) : totalViews === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="font-semibold text-slate-900">No traffic recorded for this month</p>
          <p className="mt-1 text-sm text-slate-500">Views are logged automatically as visitors browse the public site.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-500">Total page views</p>
              <p className="mt-1 font-display text-3xl font-bold text-slate-900">{totalViews.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-500">Unique sessions</p>
              <p className="mt-1 font-display text-3xl font-bold text-slate-900">{uniqueSessions.toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="font-semibold text-slate-900">Views by day</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6b21a8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="font-semibold text-slate-900">Top pages</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-2 pr-4 font-medium">Page</th>
                    <th className="pb-2 pr-4 font-medium">Views</th>
                    <th className="pb-2 font-medium">Unique sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {byPage.slice(0, 100).map((p) => (
                    <tr key={p.path} className="border-b border-slate-100">
                      <td className="max-w-md truncate py-2 pr-4 font-medium text-slate-900">{p.path}</td>
                      <td className="py-2 pr-4 tabular-nums text-slate-700">{p.views.toLocaleString()}</td>
                      <td className="py-2 tabular-nums text-slate-700">{p.sessions.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
