/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CalendarCheck, Truck, PoundSterling, Gift, Calendar, MapPin, ChevronRight, X } from "lucide-react";
import { DriverRatingsWidget } from "@/components/drivers/DriverRatingsWidget";

/** Local YYYY-MM-DD for a date (avoids UTC shift from toISOString). */
function toDateKey(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

export default function DriverDashboardPage() {
  const [stats, setStats] = useState({
    jobsThisWeek: 0,
    jobsThisMonth: 0,
    earningsThisMonth: 0,
    tipsThisMonth: 0,
  });
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Get driver ID
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!driver) return;

    // Calculate date ranges
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch jobs count for this week
    const { count: weekJobs } = await supabase
      .from("booking_driver_assignments")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driver.id);

    // Fetch jobs count for this month
    const { count: monthJobs } = await supabase
      .from("booking_driver_assignments")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driver.id);

    // Fetch earnings for this month
    const { data: earnings } = await supabase
      .from("driver_earnings")
      .select("total_earnings, tip_amount")
      .eq("driver_id", driver.id)
      .gte("created_at", startOfMonth.toISOString());

    const totalEarnings = earnings?.reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0;
    const totalTips = earnings?.reduce((sum, e) => sum + (e.tip_amount || 0), 0) || 0;

    setStats({
      jobsThisWeek: weekJobs || 0,
      jobsThisMonth: monthJobs || 0,
      earningsThisMonth: totalEarnings,
      tipsThisMonth: totalTips,
    });

    // Fetch upcoming jobs (assigned, move_date today or later) — next 5
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: assignments } = await supabase
      .from("booking_driver_assignments")
      .select(
        `
        id,
        booking:bookings(
          id, reference, service_type, move_date, latest_driver_status,
          customer:customers(full_name),
          origin_address:addresses!origin_address_id(postcode),
          destination_address:addresses!destination_address_id(postcode)
        )
      `
      )
      .eq("driver_id", driver.id);

    // Keep all dated assignments, sorted by date — render derives the view.
    const dated = (assignments || [])
      .filter((a: any) => a.booking?.move_date)
      .sort(
        (a: any, b: any) =>
          new Date(a.booking.move_date).getTime() -
          new Date(b.booking.move_date).getTime()
      );

    setAllJobs(dated);
    setLoading(false);
  }

  const kpiCards = [
    {
      label: "Jobs This Week",
      value: stats.jobsThisWeek,
      icon: CalendarCheck,
      color: "purple",
    },
    {
      label: "Jobs This Month",
      value: stats.jobsThisMonth,
      icon: Truck,
      color: "blue",
    },
    {
      label: "Earnings This Month",
      value: `£${stats.earningsThisMonth.toFixed(2)}`,
      icon: PoundSterling,
      color: "green",
    },
    {
      label: "Tips This Month",
      value: `£${stats.tipsThisMonth.toFixed(2)}`,
      icon: Gift,
      color: "amber",
    },
  ];

  // Default: next 5 upcoming (today onward). With a date picked: that day's jobs.
  const todayKey = toDateKey(new Date());
  const displayedJobs = selectedDate
    ? allJobs.filter((a) => toDateKey(new Date(a.booking.move_date)) === selectedDate)
    : allJobs
        .filter((a) => toDateKey(new Date(a.booking.move_date)) >= todayKey)
        .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here&apos;s your overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${card.color}-100`}
              >
                <card.icon className={`h-6 w-6 text-${card.color}-600`} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900">
                {card.value}
              </div>
              <div className="text-sm text-slate-600">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer ratings */}
      <DriverRatingsWidget />

      {/* Upcoming Jobs Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {selectedDate ? "Jobs on selected date" : "Upcoming Jobs"}
          </h2>
          <Link
            href="/drivers/jobs"
            className="text-sm font-medium text-brand-purple-600 hover:text-brand-purple-700"
          >
            View all
          </Link>
        </div>

        {/* Compact date filter */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              setSelectedDate(toDateKey(d));
            }}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Tomorrow
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 2);
              setSelectedDate(toDateKey(d));
            }}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            In 2 days
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-purple-500 focus:outline-none"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {displayedJobs.length === 0 ? (
          <p className="text-slate-600">
            {selectedDate
              ? "No jobs scheduled for this date."
              : "No upcoming jobs scheduled. Check back soon!"}
          </p>
        ) : (
          <div className="space-y-3">
            {displayedJobs.map((assignment) => {
              const booking = assignment.booking;
              const isToday =
                booking.move_date &&
                new Date(booking.move_date).toDateString() ===
                  new Date().toDateString();
              return (
                <Link
                  key={assignment.id}
                  href={`/drivers/jobs/${booking.id}`}
                  className={`flex items-center justify-between gap-4 rounded-xl border bg-white p-4 transition-all hover:shadow-md ${
                    isToday ? "border-l-4 border-l-brand-purple-600" : "border-slate-200"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-medium ${
                          isToday
                            ? "bg-brand-purple-100 text-brand-purple-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {isToday
                          ? "Today"
                          : new Date(booking.move_date).toLocaleDateString("en-GB")}
                      </span>
                      <span className="rounded-lg bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {booking.service_type?.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>
                    <div className="truncate font-semibold text-slate-900">
                      {booking.customer?.full_name?.split(" ")[0]}{" "}
                      {booking.customer?.full_name?.split(" ")[1]?.[0]}.
                    </div>
                    {booking.origin_address && (
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{booking.origin_address.postcode}</span>
                        {booking.destination_address && (
                          <>
                            <span>→</span>
                            <span>{booking.destination_address.postcode}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
