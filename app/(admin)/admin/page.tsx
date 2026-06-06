"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp, TrendingDown, ClipboardList, CalendarCheck,
  PoundSterling, Target, AlertCircle, Eye, RefreshCw,
  ArrowRight, Phone,
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ServiceBadge } from "@/components/admin/ServiceBadge";
import { Skeleton } from "@/components/admin/AdminSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { SERVICE_LABELS_SHORT, IN_PROGRESS_STATUSES } from "@/lib/constants";
import type { BookingStatus, ServiceType } from "@/types";

// ── Hooks ──────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = Date.now();
    const step = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface KpiData {
  todayBookings: number;
  yesterdayBookings: number;
  weekJobs: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  conversionRate: number;
  outstanding: number;
  sparkline: { day: string; count: number }[];
}

interface ActivityEntry {
  id: string; action: string; created_at: string;
  booking_id: string | null; performed_by: string;
}

interface UpcomingJob {
  id: string; reference: string; service_type: ServiceType;
  status: BookingStatus; move_date: string; customer_name: string;
  origin_postcode: string;
}

interface WeeklyBar { day: string; [key: string]: number | string }
interface PipelineSlice { name: string; value: number; colour: string }

// ── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({
  label, value, prefix = "", suffix = "", trend, sparkData, isLoading,
  colour = "purple",
}: {
  label: string; value: number; prefix?: string; suffix?: string;
  trend?: number; sparkData?: { day: string; count: number }[];
  isLoading?: boolean; colour?: "purple" | "green" | "amber" | "blue";
}) {
  const animated = useCountUp(value);
  const colours = {
    purple: { text: "text-purple-700", bg: "from-purple-50 to-white", stroke: "#6b21a8" },
    green: { text: "text-green-700", bg: "from-green-50 to-white", stroke: "#16a34a" },
    amber: { text: "text-amber-700", bg: "from-amber-50 to-white", stroke: "#d97706" },
    blue: { text: "text-blue-700", bg: "from-blue-50 to-white", stroke: "#2563eb" },
  }[colour];

  return (
    <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${colours.bg} p-5 shadow-sm transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="mt-3 h-9 w-24" />
      ) : (
        <p className={`mt-2 font-display text-3xl font-bold ${colours.text}`}>
          {prefix}{typeof value === "number" && value >= 1000 ? animated.toLocaleString() : animated}{suffix}
        </p>
      )}
      {sparkData && sparkData.length > 0 && !isLoading && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="count" stroke={colours.stroke} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingJob[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyBar[]>([]);
  const [pipelineData, setPipelineData] = useState<PipelineSlice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const load = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last7 = new Date(now); last7.setDate(now.getDate() - 7);

    const [
      { count: todayCount },
      { count: yesterdayCount },
      { count: weekCount },
      { data: paidInvoices },
      { data: lastMonthInvoices },
      { count: totalCount },
      { count: completedCount },
      { data: outstandingInvoices },
      { data: sparkData },
      { data: activityData },
      { data: upcomingData },
      { data: allBookings },
    ] = await Promise.all([
      supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
      supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()),
      supabase.from("bookings").select("*", { count: "exact", head: true }).gte("move_date", weekStart.toISOString().slice(0, 10)),
      supabase.from("invoices").select("total").eq("status", "paid").gte("paid_at", monthStart.toISOString()),
      supabase.from("invoices").select("total").eq("status", "paid").gte("paid_at", lastMonthStart.toISOString()).lt("paid_at", monthStart.toISOString()),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "job_completed"),
      supabase.from("invoices").select("total").in("status", ["sent", "overdue"]),
      supabase.from("bookings").select("created_at").gte("created_at", last7.toISOString()).order("created_at"),
      supabase.from("activity_log").select("id, action, created_at, booking_id, performed_by").order("created_at", { ascending: false }).limit(20),
      supabase.from("bookings").select("id, reference, service_type, status, move_date, customers!inner(full_name), origin_addr:addresses!origin_address_id(postcode)").gte("move_date", now.toISOString().slice(0, 10)).lte("move_date", new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)).order("move_date"),
      supabase.from("bookings").select("status, service_type, move_date").gte("created_at", weekStart.toISOString()),
    ]);

    // Sparkline: group by day
    const sparks: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      sparks[d.toISOString().slice(0, 10)] = 0;
    }
    (sparkData ?? []).forEach((b: { created_at: string }) => {
      const day = b.created_at.slice(0, 10);
      if (day in sparks) sparks[day] = (sparks[day] ?? 0) + 1;
    });

    // Weekly bar chart
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekMap: Record<string, Record<string, number>> = {};
    days.forEach(d => { weekMap[d] = {}; });
    (allBookings ?? []).forEach((b: { status: BookingStatus; service_type: ServiceType; move_date: string }) => {
      if (!b.move_date) return;
      const dayIdx = new Date(b.move_date).getDay();
      const dayName = days[dayIdx === 0 ? 6 : dayIdx - 1];
      if (!weekMap[dayName]) weekMap[dayName] = {};
      weekMap[dayName][b.service_type] = (weekMap[dayName][b.service_type] ?? 0) + 1;
    });
    setWeeklyData(days.map(d => ({ day: d, ...(weekMap[d] ?? {}) })));

    // Pipeline donut
    const pipeline: Record<string, number> = {
      "Inquiries": 0, "In Progress": 0, "Confirmed": 0, "Completed": 0, "Lost": 0,
    };
    (allBookings ?? []).forEach((b: { status: BookingStatus }) => {
      if (b.status === "inquiry") pipeline["Inquiries"]++;
      else if (IN_PROGRESS_STATUSES.includes(b.status)) pipeline["In Progress"]++;
      else if (["deposit_paid_job_confirmed", "full_balance_paid"].includes(b.status)) pipeline["Confirmed"]++;
      else if (b.status === "job_completed") pipeline["Completed"]++;
      else if (["bad_lead", "not_a_good_fit"].includes(b.status)) pipeline["Lost"]++;
    });
    const PIE_COLS = ["#6b21a8", "#2563eb", "#16a34a", "#10b981", "#ef4444"];
    setPipelineData(Object.entries(pipeline).filter(([, v]) => v > 0).map(([name, value], i) => ({ name, value, colour: PIE_COLS[i % PIE_COLS.length] })));

    const monthRev = (paidInvoices ?? []).reduce((a: number, i: { total: number }) => a + i.total, 0);
    const lastRev = (lastMonthInvoices ?? []).reduce((a: number, i: { total: number }) => a + i.total, 0);
    const outstanding = (outstandingInvoices ?? []).reduce((a: number, i: { total: number }) => a + i.total, 0);
    const convRate = (totalCount ?? 0) > 0 ? Math.round(((completedCount ?? 0) / (totalCount ?? 1)) * 100) : 0;
    const revTrend = lastRev > 0 ? Math.round(((monthRev - lastRev) / lastRev) * 100) : 0;
    const dayTrend = (yesterdayCount ?? 0) > 0 ? Math.round((((todayCount ?? 0) - (yesterdayCount ?? 0)) / (yesterdayCount ?? 1)) * 100) : 0;

    setKpi({
      todayBookings: todayCount ?? 0,
      yesterdayBookings: yesterdayCount ?? 0,
      weekJobs: weekCount ?? 0,
      monthRevenue: monthRev,
      lastMonthRevenue: lastRev,
      conversionRate: convRate,
      outstanding,
      sparkline: Object.entries(sparks).map(([day, count]) => ({ day: day.slice(5), count })),
    });

    setActivity((activityData ?? []) as ActivityEntry[]);
    setUpcoming((upcomingData ?? []).map((b: Record<string, unknown>) => ({
      id: b.id as string, reference: b.reference as string,
      service_type: b.service_type as ServiceType, status: b.status as BookingStatus,
      move_date: b.move_date as string,
      customer_name: (b.customers as { full_name: string } | null)?.full_name ?? "—",
      origin_postcode: (b.origin_addr as { postcode: string } | null)?.postcode ?? "—",
    })));

    setIsLoading(false);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh + seconds counter
  useEffect(() => {
    const tick = setInterval(() => setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000)), 1000);
    const autoRefresh = setInterval(load, 60000);
    return () => { clearInterval(tick); clearInterval(autoRefresh); };
  }, [lastUpdated, load]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("dashboard-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bookings" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, (payload) => {
        setActivity(prev => [payload.new as ActivityEntry, ...prev].slice(0, 20));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const dayTrend = kpi && kpi.yesterdayBookings > 0
    ? Math.round(((kpi.todayBookings - kpi.yesterdayBookings) / kpi.yesterdayBookings) * 100) : 0;
  const revTrend = kpi && kpi.lastMonthRevenue > 0
    ? Math.round(((kpi.monthRevenue - kpi.lastMonthRevenue) / kpi.lastMonthRevenue) * 100) : 0;

  const SERVICE_COLOURS_HEX: Partial<Record<ServiceType, string>> = {
    removals: "#6b21a8", man_and_van: "#2563eb", house_clearance: "#f97316",
    house_cleaning: "#0d9488", end_of_tenancy: "#db2777",
  };

  const serviceTypes: ServiceType[] = ["removals", "man_and_van", "house_clearance", "house_cleaning", "end_of_tenancy"];

  function getDayLabel(dateStr: string): { label: string; colour: string } {
    const d = new Date(dateStr);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return { label: "Today", colour: "bg-purple-100 text-purple-800" };
    if (diff === 1) return { label: "Tomorrow", colour: "bg-amber-100 text-amber-800" };
    return { label: formatDate(dateStr), colour: "bg-slate-100 text-slate-700" };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500">Live overview of your business</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Updated {secondsAgo}s ago</span>
          <button onClick={load} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Today's Bookings" value={kpi?.todayBookings ?? 0} trend={dayTrend} sparkData={kpi?.sparkline} isLoading={isLoading} colour="purple" />
        <KpiCard label="Jobs This Week" value={kpi?.weekJobs ?? 0} isLoading={isLoading} colour="blue" />
        <KpiCard label="Monthly Revenue" value={kpi?.monthRevenue ?? 0} prefix="£" trend={revTrend} isLoading={isLoading} colour="green" />
        <KpiCard label="Conversion Rate" value={kpi?.conversionRate ?? 0} suffix="%" isLoading={isLoading} colour="purple" />
        <KpiCard label="Outstanding" value={kpi?.outstanding ?? 0} prefix="£" isLoading={isLoading} colour="amber" />
      </div>

      {/* Row 2: Charts */}
      <div className="grid gap-6 lg:grid-cols-[65fr_35fr]">
        {/* Weekly bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 font-semibold text-slate-900">Bookings This Week</h3>
          {isLoading ? <Skeleton className="h-56" /> : weeklyData.every(d => serviceTypes.every(s => !d[s])) ? (
            <div className="flex h-56 flex-col items-center justify-center text-center">
              <CalendarCheck className="mb-2 h-10 w-10 text-slate-200" />
              <p className="text-sm text-slate-400">No bookings with move dates this week</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                {serviceTypes.map(s => (
                  <Bar key={s} dataKey={s} name={SERVICE_LABELS_SHORT[s]} stackId="a" fill={SERVICE_COLOURS_HEX[s] ?? "#6b21a8"} radius={[0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pipeline donut */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 font-semibold text-slate-900">Pipeline Summary</h3>
          {isLoading ? <Skeleton className="h-56" /> : pipelineData.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-center">
              <Target className="mb-2 h-10 w-10 text-slate-200" />
              <p className="text-sm text-slate-400">No active bookings</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <PieChart>
                <Pie data={pipelineData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                  {pipelineData.map((entry, i) => <Cell key={i} fill={entry.colour} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Activity + Upcoming */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity feed */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="max-h-80 divide-y divide-slate-50 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="mb-2 h-8 w-8 text-slate-200" />
                <p className="text-sm text-slate-400">No activity yet</p>
              </div>
            ) : activity.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                <p className="flex-1 truncate text-sm text-slate-700">{a.action}</p>
                <span className="shrink-0 text-xs text-slate-400">
                  {Math.floor((Date.now() - new Date(a.created_at).getTime()) / 60000)}m ago
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming jobs */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Upcoming Jobs (7 days)</h3>
            <Link href="/admin/calendar" className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline">
              Calendar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="max-h-80 divide-y divide-slate-50 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarCheck className="mb-2 h-8 w-8 text-slate-200" />
                <p className="text-sm text-slate-400">No jobs in the next 7 days</p>
              </div>
            ) : upcoming.map(j => {
              const { label, colour } = getDayLabel(j.move_date);
              return (
                <div key={j.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/admin/bookings/${j.id}`)}>
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${colour}`}>{label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{j.customer_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ServiceBadge service={j.service_type} />
                      <StatusBadge status={j.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={`tel:`} onClick={e => e.stopPropagation()} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-green-600">
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <button onClick={() => router.push(`/admin/bookings/${j.id}`)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-purple-700">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
