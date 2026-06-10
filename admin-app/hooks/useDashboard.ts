/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BookingStatus } from "@/types";

const IN_PROGRESS: BookingStatus[] = [
  "called", "not_called", "answered", "not_answered", "processing", "pending",
  "deposit_invoice_sent", "deposit_paid_job_confirmed", "full_invoice_sent", "full_balance_paid",
];

export interface DashboardData {
  todayBookings: number;
  yesterdayBookings: number;
  weekJobs: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  conversionRate: number;
  outstanding: number;
  sparkline: { day: string; count: number }[];
  pipeline: { name: string; value: number; colour: string }[];
  activity: { id: string; action: string; created_at: string; performed_by?: string | null }[];
}

const PIE_COLS = ["#6b21a8", "#2563eb", "#16a34a", "#10b981", "#ef4444"];

async function loadDashboard(): Promise<DashboardData> {
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
    supabase.from("activity_log").select("id, action, created_at, performed_by").order("created_at", { ascending: false }).limit(20),
    supabase.from("bookings").select("status").limit(2000),
  ]);

  // Sparkline: new bookings per day, last 7 days
  const sparks: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    sparks[d.toISOString().slice(0, 10)] = 0;
  }
  (sparkData ?? []).forEach((b: any) => {
    const day = b.created_at.slice(0, 10);
    if (day in sparks) sparks[day] += 1;
  });

  // Pipeline breakdown
  const pipeline: Record<string, number> = {
    Inquiries: 0, "In Progress": 0, Confirmed: 0, Completed: 0, Lost: 0,
  };
  (allBookings ?? []).forEach((b: any) => {
    if (b.status === "inquiry") pipeline.Inquiries++;
    else if (IN_PROGRESS.includes(b.status)) pipeline["In Progress"]++;
    else if (["deposit_paid_job_confirmed", "full_balance_paid"].includes(b.status)) pipeline.Confirmed++;
    else if (b.status === "job_completed") pipeline.Completed++;
    else if (["bad_lead", "not_a_good_fit"].includes(b.status)) pipeline.Lost++;
  });

  const monthRevenue = (paidInvoices ?? []).reduce((a: number, i: any) => a + (i.total ?? 0), 0);
  const lastMonthRevenue = (lastMonthInvoices ?? []).reduce((a: number, i: any) => a + (i.total ?? 0), 0);
  const outstanding = (outstandingInvoices ?? []).reduce((a: number, i: any) => a + (i.total ?? 0), 0);
  const conversionRate = (totalCount ?? 0) > 0 ? Math.round(((completedCount ?? 0) / (totalCount ?? 1)) * 100) : 0;

  return {
    todayBookings: todayCount ?? 0,
    yesterdayBookings: yesterdayCount ?? 0,
    weekJobs: weekCount ?? 0,
    monthRevenue,
    lastMonthRevenue,
    conversionRate,
    outstanding,
    sparkline: Object.entries(sparks).map(([day, count]) => ({ day: day.slice(5), count })),
    pipeline: Object.entries(pipeline)
      .filter(([, v]) => v > 0)
      .map(([name, value], i) => ({ name, value, colour: PIE_COLS[i % PIE_COLS.length] })),
    activity: (activityData ?? []) as DashboardData["activity"],
  };
}

export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: loadDashboard });
}
