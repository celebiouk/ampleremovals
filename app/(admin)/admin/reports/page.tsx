"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/admin/AdminSkeleton";
import { SERVICE_LABELS_SHORT, STATUS_LABELS, SERVICE_COLOURS, STATUS_COLOURS } from "@/lib/constants";
import type { ServiceType, BookingStatus } from "@/types";

type Range = "7d" | "30d" | "90d" | "year" | "all";

const RANGES: { key: Range; label: string }[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

function getFromDate(range: Range): string | null {
  const now = new Date();
  if (range === "7d") { now.setDate(now.getDate() - 7); return now.toISOString(); }
  if (range === "30d") { now.setDate(now.getDate() - 30); return now.toISOString(); }
  if (range === "90d") { now.setDate(now.getDate() - 90); return now.toISOString(); }
  if (range === "year") { return new Date(now.getFullYear(), 0, 1).toISOString(); }
  return null;
}

// Extract tailwind colour to hex for recharts
const SERVICE_HEX: Record<ServiceType, string> = {
  removals: "#9333ea", man_and_van: "#2563eb", house_clearance: "#f97316",
  house_cleaning: "#0d9488", end_of_tenancy: "#db2777",
};

interface BookingRecord { service_type: ServiceType; status: BookingStatus; created_at: string; source: string }

export default function AdminReportsPage() {
  const [range, setRange] = useState<Range>("30d");
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const from = getFromDate(range);
    let q = supabase.from("bookings").select("service_type, status, created_at, source").order("created_at", { ascending: true });
    if (from) q = q.gte("created_at", from);
    const { data } = await q;
    setBookings((data ?? []) as BookingRecord[]);
    setIsLoading(false);
  }, [range]);

  useEffect(() => { loadData(); }, [loadData]);

  // Chart 1: by service
  const serviceData = Object.entries(
    bookings.reduce((acc, b) => { acc[b.service_type] = (acc[b.service_type] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([service, count]) => ({ name: SERVICE_LABELS_SHORT[service as ServiceType], count, colour: SERVICE_HEX[service as ServiceType] }));

  // Chart 2: by status
  const statusData = Object.entries(
    bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([status, count]) => ({ name: STATUS_LABELS[status as BookingStatus], count, colour: "#6b21a8" }));

  // Chart 3: over time
  const timeGroupKey = (date: string) => {
    const d = new Date(date);
    if (range === "7d" || range === "30d") return d.toISOString().slice(0, 10);
    const week = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (7 * 86400000));
    return `W${week}`;
  };
  const timeData = Object.entries(
    bookings.reduce((acc, b) => { const k = timeGroupKey(b.created_at); acc[k] = (acc[k] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

  // Chart 4: by source
  const sourceData = Object.entries(
    bookings.reduce((acc, b) => { acc[b.source ?? "website"] = (acc[b.source ?? "website"] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([source, count]) => ({ name: source.charAt(0).toUpperCase() + source.slice(1), count }));

  // Summary stats
  const total = bookings.length;
  const completed = bookings.filter(b => b.status === "job_completed").length;
  const convRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const topServiceEntry = serviceData.sort((a, b) => b.count - a.count)[0];

  const PIE_COLOURS = ["#6b21a8", "#2563eb", "#f97316", "#0d9488", "#db2777", "#64748b", "#eab308", "#ef4444", "#10b981", "#6366f1", "#f43f5e", "#84cc16", "#06b6d4", "#a855f7"];

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500">Booking analytics and pipeline overview</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {RANGES.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${range === r.key ? "bg-brand-purple-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Bookings", value: total },
            { label: "Conversion Rate", value: `${convRate}%` },
            { label: "Top Service", value: topServiceEntry?.name ?? "—" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: by service */}
        <Card title="Bookings by Service">
          {isLoading ? <Skeleton className="h-64" /> : serviceData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={serviceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {serviceData.map((entry, i) => <Cell key={i} fill={entry.colour} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Chart 2: by status */}
        <Card title="Bookings by Status">
          {isLoading ? <Skeleton className="h-64" /> : statusData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40} paddingAngle={2}>
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Chart 3: over time */}
        <Card title="Bookings Over Time">
          {isLoading ? <Skeleton className="h-64" /> : timeData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={timeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b21a8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6b21a8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#6b21a8" strokeWidth={2} fill="url(#bookingGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Chart 4: by source */}
        <Card title="Bookings by Source">
          {isLoading ? <Skeleton className="h-64" /> : sourceData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={sourceData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40} paddingAngle={2}>
                  {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
