"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList, CalendarCheck, Target, Eye, RefreshCw,
  ArrowRight, Phone, Wallet, Truck, Briefcase, ArrowUpRight,
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, Tooltip, XAxis,
  BarChart, Bar, YAxis, CartesianGrid, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ServiceBadge } from "@/components/admin/ServiceBadge";
import { Skeleton } from "@/components/admin/AdminSkeleton";
import { formatCurrency, formatDate, upperName } from "@/lib/utils";
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

interface RevenuePoint { date: string; label: string; amount: number }

interface HeroData {
  revenueSeries: RevenuePoint[]; // last 30 days, sliced client-side per toggle
  outstanding: number;
  bookings14d: number;
  bookings14dSparkline: { day: string; count: number }[];
  jobsToday: number;
  activeDrivers: number;
  depositsToConfirm: number;
  attention: number;
  newEnquiriesToday: number;
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

type RevenueWindow = 7 | 14 | 30;

// ── Small building blocks ───────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function AlertPill({ href, count, label, tone }: { href: string; count: number; label: string; tone: "red" | "blue" }) {
  if (count === 0) return null;
  const dot = tone === "red" ? "bg-red-400" : "bg-sky-400";
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/15"
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {count} {label}
      <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
    </Link>
  );
}

function SideStat({
  icon, label, value, sub, sparkData,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  sparkData?: { day: string; count: number }[];
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/8 px-4 py-3.5 ring-1 ring-white/10">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-white/60">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="mt-1 font-display text-xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-white/50">{sub}</p>}
      </div>
      {sparkData && sparkData.length > 0 && (
        <div className="h-9 w-16 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="count" stroke="#5eead4" strokeWidth={2} dot={false} />
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
  const [hero, setHero] = useState<HeroData | null>(null);
  const [revenueWindow, setRevenueWindow] = useState<RevenueWindow>(14);
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
    const todayKey = now.toISOString().slice(0, 10);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1);
    const last14 = new Date(now); last14.setDate(now.getDate() - 14);
    const last30 = new Date(now); last30.setDate(now.getDate() - 30);

    const [
      { data: revenueInvoices },
      { count: outstandingCount },
      { data: outstandingInvoices },
      { count: bookings14dCount },
      { data: sparkData },
      { count: jobsTodayCount },
      { count: activeDriversCount },
      { count: depositsCount },
      { count: attentionCount },
      { count: newEnquiriesCount },
      { data: activityData },
      { data: upcomingData },
      { data: allBookings },
    ] = await Promise.all([
      supabase.from("invoices").select("total, paid_at").eq("status", "paid").gte("paid_at", last30.toISOString()),
      supabase.from("invoices").select("*", { count: "exact", head: true }).in("status", ["sent", "overdue"]),
      supabase.from("invoices").select("total").in("status", ["sent", "overdue"]),
      supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", last14.toISOString()),
      supabase.from("bookings").select("created_at").gte("created_at", last14.toISOString()).order("created_at"),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("move_date", todayKey).eq("status", "deposit_paid_job_confirmed"),
      supabase.from("drivers").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "deposit_invoice_sent"),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("is_flagged", true).not("status", "in", "(job_completed,bad_lead,not_a_good_fit)"),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "inquiry").gte("created_at", todayStart.toISOString()),
      supabase.from("activity_log").select("id, action, created_at, booking_id, performed_by").order("created_at", { ascending: false }).limit(20),
      supabase.from("bookings").select("id, reference, service_type, status, move_date, customers!inner(full_name), origin_addr:addresses!origin_address_id(postcode)").gte("move_date", now.toISOString().slice(0, 10)).lte("move_date", new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)).order("move_date"),
      supabase.from("bookings").select("status, service_type, move_date").gte("created_at", weekStart.toISOString()),
    ]);

    // Outstanding total (separate from the head:true count query above).
    const outstandingTotal = (outstandingInvoices ?? []).reduce((a: number, i: { total: number }) => a + i.total, 0);
    void outstandingCount; // count not needed once we have the summed total

    // Revenue series: last 30 days, one point per day — the 7D/14D/30D toggle
    // just slices this client-side so switching windows is instant.
    const revByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      revByDay[d.toISOString().slice(0, 10)] = 0;
    }
    (revenueInvoices ?? []).forEach((inv: { total: number; paid_at: string }) => {
      const day = inv.paid_at?.slice(0, 10);
      if (day && day in revByDay) revByDay[day] += inv.total;
    });
    const revenueSeries: RevenuePoint[] = Object.entries(revByDay).map(([date, amount]) => ({
      date, amount, label: date.slice(8, 10) + "/" + date.slice(5, 7),
    }));

    // Bookings (14d) sparkline
    const sparks: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      sparks[d.toISOString().slice(0, 10)] = 0;
    }
    (sparkData ?? []).forEach((b: { created_at: string }) => {
      const day = b.created_at.slice(0, 10);
      if (day in sparks) sparks[day] = (sparks[day] ?? 0) + 1;
    });

    setHero({
      revenueSeries,
      outstanding: outstandingTotal,
      bookings14d: bookings14dCount ?? 0,
      bookings14dSparkline: Object.entries(sparks).map(([day, count]) => ({ day: day.slice(5), count })),
      jobsToday: jobsTodayCount ?? 0,
      activeDrivers: activeDriversCount ?? 0,
      depositsToConfirm: depositsCount ?? 0,
      attention: attentionCount ?? 0,
      newEnquiriesToday: newEnquiriesCount ?? 0,
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

  const windowedSeries = hero?.revenueSeries.slice(-revenueWindow) ?? [];
  const windowedTotal = windowedSeries.reduce((a, p) => a + p.amount, 0);
  const revenueAnimated = useCountUp(windowedTotal);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* ── Hero overview ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-purple-950 via-brand-purple-900 to-brand-purple-800 p-6 shadow-lg sm:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/60">{today}</p>
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">{greeting()}, Ample</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40">Updated {secondsAgo}s ago</span>
            <button onClick={load} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/70 ring-1 ring-white/15 hover:bg-white/15">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Alert pills */}
        {!isLoading && hero && (hero.depositsToConfirm > 0 || hero.attention > 0 || hero.newEnquiriesToday > 0) && (
          <div className="relative mt-4 flex flex-wrap gap-2.5">
            <AlertPill href="/admin/deposits" count={hero.depositsToConfirm} label="deposits to confirm" tone="red" />
            <AlertPill href="/admin/bookings" count={hero.attention} label="bookings need attention" tone="red" />
            <AlertPill href="/admin/bookings?status=inquiry" count={hero.newEnquiriesToday} label="new enquiries today" tone="blue" />
          </div>
        )}

        <div className="relative mt-6 grid gap-5 lg:grid-cols-[65fr_35fr]">
          {/* Revenue + chart */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white/60">Revenue received · last {revenueWindow} days</p>
                {isLoading ? (
                  <div className="mt-2 h-11 w-40 animate-pulse rounded-lg bg-white/10" />
                ) : (
                  <p className="font-display text-4xl font-bold text-white">{formatCurrency(revenueAnimated)}</p>
                )}
              </div>
              <div className="flex rounded-xl bg-white/10 p-1 ring-1 ring-white/10">
                {([7, 14, 30] as RevenueWindow[]).map((w) => (
                  <button
                    key={w}
                    onClick={() => setRevenueWindow(w)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${revenueWindow === w ? "bg-white text-brand-purple-900" : "text-white/70 hover:text-white"}`}
                  >
                    {w}D
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 h-40">
              {isLoading ? (
                <div className="h-full w-full animate-pulse rounded-xl bg-white/5" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={windowedSeries} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <Tooltip
                      formatter={(v) => [formatCurrency(Number(v)), "Revenue"]}
                      contentStyle={{ background: "rgba(15,8,30,0.9)", border: "none", borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#5eead4" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Side stats */}
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
            <SideStat icon={<Wallet className="h-3.5 w-3.5" />} label="Outstanding" value={isLoading ? "—" : formatCurrency(hero?.outstanding ?? 0)} sub={!isLoading && hero?.outstanding === 0 ? "Nothing unpaid" : undefined} />
            <SideStat icon={<ClipboardList className="h-3.5 w-3.5" />} label={`Bookings, 14 days`} value={isLoading ? "—" : String(hero?.bookings14d ?? 0)} sub="received" sparkData={hero?.bookings14dSparkline} />
            <SideStat icon={<Briefcase className="h-3.5 w-3.5" />} label="Jobs today" value={isLoading ? "—" : String(hero?.jobsToday ?? 0)} sub="confirmed for today" />
            <SideStat icon={<Truck className="h-3.5 w-3.5" />} label="Active drivers" value={isLoading ? "—" : String(hero?.activeDrivers ?? 0)} sub="on the roster" />
          </div>
        </div>
      </div>

      {/* Row: Charts */}
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

      {/* Row: Activity + Upcoming */}
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
                    <p className="truncate text-sm font-medium text-slate-800">{upperName(j.customer_name)}</p>
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
