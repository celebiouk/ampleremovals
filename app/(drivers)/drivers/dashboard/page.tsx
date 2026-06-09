"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CalendarCheck, Truck, PoundSterling, Gift } from "lucide-react";

export default function DriverDashboardPage() {
  const [stats, setStats] = useState({
    jobsThisWeek: 0,
    jobsThisMonth: 0,
    earningsThisMonth: 0,
    tipsThisMonth: 0,
  });
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

      {/* Upcoming Jobs Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Upcoming Jobs
        </h2>
        <p className="text-slate-600">
          No upcoming jobs scheduled. Check back soon!
        </p>
      </div>
    </div>
  );
}
