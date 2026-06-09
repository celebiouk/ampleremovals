/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PoundSterling, TrendingUp, Clock, CheckCircle2, Gift, Loader2 } from "lucide-react";
import { EARNINGS_STATUS_LABELS } from "@/lib/constants";

export default function DriverEarningsPage() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEarned: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    totalTips: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  async function loadEarnings() {
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

    // Fetch earnings with booking details
    const { data: earningsData } = await supabase
      .from("driver_earnings")
      .select(
        `
        *,
        booking:bookings(reference, service_type, move_date)
      `
      )
      .eq("driver_id", driver.id)
      .order("created_at", { ascending: false });

    if (earningsData) {
      setEarnings(earningsData);

      // Calculate stats
      const totalEarned = earningsData
        .filter((e) => e.status !== "disputed")
        .reduce((sum, e) => sum + (e.total_earnings || 0), 0);

      const pending = earningsData
        .filter((e) => e.status === "pending")
        .reduce((sum, e) => sum + (e.total_earnings || 0), 0);

      const approved = earningsData
        .filter((e) => e.status === "approved")
        .reduce((sum, e) => sum + (e.total_earnings || 0), 0);

      const paid = earningsData
        .filter((e) => e.status === "paid")
        .reduce((sum, e) => sum + (e.total_earnings || 0), 0);

      const totalTips = earningsData.reduce(
        (sum, e) => sum + (e.tip_amount || 0),
        0
      );

      setStats({ totalEarned, pending, approved, paid, totalTips });
    }

    setLoading(false);
  }

  const summaryCards = [
    {
      label: "Total Earned",
      value: `£${stats.totalEarned.toFixed(2)}`,
      icon: TrendingUp,
      color: "purple",
    },
    {
      label: "Pending Approval",
      value: `£${stats.pending.toFixed(2)}`,
      icon: Clock,
      color: "amber",
    },
    {
      label: "Approved",
      value: `£${stats.approved.toFixed(2)}`,
      icon: CheckCircle2,
      color: "green",
    },
    {
      label: "Paid Out",
      value: `£${stats.paid.toFixed(2)}`,
      icon: PoundSterling,
      color: "blue",
    },
    {
      label: "Total Tips",
      value: `£${stats.totalTips.toFixed(2)}`,
      icon: Gift,
      color: "pink",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Earnings</h1>
        <p className="text-slate-600">Track your earnings and payment status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${card.color}-100`}
              >
                <card.icon className={`h-5 w-5 text-${card.color}-600`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {card.value}
            </div>
            <div className="text-sm text-slate-600">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Earnings Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Earnings History
          </h2>
        </div>

        {earnings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600">No earnings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    Booking Ref
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    Service
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                    Gross
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                    Tips
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {earnings.map((earning) => (
                  <tr key={earning.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                      {new Date(earning.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-slate-600">
                      {earning.booking?.reference || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {earning.booking?.service_type?.replace(/_/g, " ") || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-900">
                      £{earning.gross_earnings?.toFixed(2) || "0.00"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600">
                      {earning.tip_amount > 0
                        ? `£${earning.tip_amount.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-slate-900">
                      £{earning.total_earnings?.toFixed(2) || "0.00"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          earning.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : earning.status === "approved"
                            ? "bg-blue-100 text-blue-700"
                            : earning.status === "disputed"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {EARNINGS_STATUS_LABELS[earning.status as keyof typeof EARNINGS_STATUS_LABELS]}
                      </span>
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
