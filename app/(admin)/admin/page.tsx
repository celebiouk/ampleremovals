"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList, Bell, CalendarCheck, AlertCircle,
  ArrowRight, Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ServiceBadge } from "@/components/admin/ServiceBadge";
import { StatCardSkeleton, TableSkeleton } from "@/components/admin/AdminSkeleton";
import { formatDate } from "@/lib/utils";
import { IN_PROGRESS_STATUSES } from "@/lib/constants";
import type { BookingStatus, ServiceType } from "@/types";

const TABS = [
  { key: "all", label: "All" },
  { key: "inquiry", label: "New Inquiries" },
  { key: "in_progress", label: "In Progress" },
  { key: "job_completed", label: "Completed" },
  { key: "bad_leads", label: "Bad Leads" },
] as const;

type TabKey = typeof TABS[number]["key"];

interface DashboardBooking {
  id: string;
  reference: string;
  service_type: ServiceType;
  status: BookingStatus;
  move_date: string | null;
  is_flexible_date: boolean;
  created_at: string;
  customer_name: string;
  origin_postcode: string;
}

interface Stats {
  total: number;
  newToday: number;
  thisWeek: number;
  outstandingInvoices: number;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [tabCounts, setTabCounts] = useState<Record<TabKey, number>>({ all: 0, inquiry: 0, in_progress: 0, job_completed: 0, bad_leads: 0 });
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingTable, setIsLoadingTable] = useState(true);

  const loadStats = useCallback(async () => {
    const supabase = createClient();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);

    const [
      { count: total },
      { count: newToday },
      { count: thisWeek },
      { count: outstandingInvoices },
    ] = await Promise.all([
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true })
        .eq("status", "inquiry").gte("created_at", today.toISOString()),
      supabase.from("bookings").select("*", { count: "exact", head: true })
        .gte("move_date", weekStart.toISOString().slice(0, 10))
        .lte("move_date", weekEnd.toISOString().slice(0, 10)),
      supabase.from("invoices").select("*", { count: "exact", head: true })
        .in("status", ["sent", "overdue"]),
    ]);
    setStats({ total: total ?? 0, newToday: newToday ?? 0, thisWeek: thisWeek ?? 0, outstandingInvoices: outstandingInvoices ?? 0 });
    setIsLoadingStats(false);
  }, []);

  const loadBookings = useCallback(async () => {
    setIsLoadingTable(true);
    const supabase = createClient();

    let q = supabase
      .from("bookings")
      .select("id, reference, service_type, status, move_date, is_flexible_date, created_at, customers!inner(full_name), origin_addr:addresses!origin_address_id(postcode)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (activeTab === "inquiry") q = q.eq("status", "inquiry");
    else if (activeTab === "in_progress") q = q.in("status", IN_PROGRESS_STATUSES);
    else if (activeTab === "job_completed") q = q.eq("status", "job_completed");
    else if (activeTab === "bad_leads") q = q.in("status", ["bad_lead", "not_a_good_fit"]);

    const { data } = await q;
    setBookings((data ?? []).map((b: Record<string, unknown>) => ({
      id: b.id as string,
      reference: b.reference as string,
      service_type: b.service_type as ServiceType,
      status: b.status as BookingStatus,
      move_date: b.move_date as string | null,
      is_flexible_date: b.is_flexible_date as boolean,
      created_at: b.created_at as string,
      customer_name: (b.customers as { full_name: string } | null)?.full_name ?? "—",
      origin_postcode: (b.origin_addr as { postcode: string } | null)?.postcode ?? "—",
    })));

    // Load tab counts
    const [all, inq, inProg, comp, bad] = await Promise.all([
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "inquiry"),
      supabase.from("bookings").select("*", { count: "exact", head: true }).in("status", IN_PROGRESS_STATUSES),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "job_completed"),
      supabase.from("bookings").select("*", { count: "exact", head: true }).in("status", ["bad_lead", "not_a_good_fit"]),
    ]);
    setTabCounts({ all: all.count ?? 0, inquiry: inq.count ?? 0, in_progress: inProg.count ?? 0, job_completed: comp.count ?? 0, bad_leads: bad.count ?? 0 });
    setIsLoadingTable(false);
  }, [activeTab]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadBookings(); }, [loadBookings]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">Overview of bookings, customers and pipeline.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={ClipboardList} label="Total Bookings" value={stats?.total ?? 0} subLabel="All time" iconColour="text-brand-purple-700" />
            <StatCard icon={Bell} label="New Inquiries Today" value={stats?.newToday ?? 0} subLabel="Awaiting review" iconColour="text-brand-green-700" accentBorder={(stats?.newToday ?? 0) > 0} />
            <StatCard icon={CalendarCheck} label="Jobs This Week" value={stats?.thisWeek ?? 0} subLabel="Scheduled this week" iconColour="text-brand-purple-700" />
            <StatCard icon={AlertCircle} label="Outstanding Invoices" value={stats?.outstandingInvoices ?? 0} subLabel="Awaiting payment" iconColour="text-amber-600" accentBorder={(stats?.outstandingInvoices ?? 0) > 0} />
          </>
        )}
      </div>

      {/* Quick filter tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-brand-purple-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Recent bookings table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Recent Bookings</h3>
          <Link href="/admin/bookings" className="flex items-center gap-1 text-sm font-medium text-brand-purple-700 hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoadingTable ? (
          <div className="p-4"><TableSkeleton rows={5} /></div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-500">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Service</th>
                  <th className="px-4 py-3 text-left">Postcode</th>
                  <th className="px-4 py-3 text-left">Move Date</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="cursor-pointer border-b border-slate-50 hover:bg-slate-50"
                    onClick={() => router.push(`/admin/bookings/${b.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-brand-purple-700">{b.reference}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{b.customer_name}</td>
                    <td className="px-4 py-3"><ServiceBadge service={b.service_type} /></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{b.origin_postcode}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {b.is_flexible_date ? "Flexible" : b.move_date ? formatDate(b.move_date) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{relativeTime(b.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs font-medium text-brand-purple-600 hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
