/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Truck, Calendar, Search, Loader2, Link2, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DRIVER_STATUS_LABELS } from "@/lib/constants";

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    jobsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "inactive" | "pending">("all");
  const [linkCopied, setLinkCopied] = useState(false);

  function copyInviteLink() {
    const inviteUrl = `${window.location.origin}/drivers/register`;
    navigator.clipboard.writeText(inviteUrl);
    setLinkCopied(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setLinkCopied(false), 2000);
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  async function loadDrivers() {
    try {
      const response = await fetch("/api/admin/drivers");
      const data = await response.json();

      if (data.success) {
        setDrivers(data.drivers || []);
        setStats(data.stats || { total: 0, active: 0, inactive: 0, jobsThisWeek: 0 });
      }
    } catch (error) {
      console.error("Failed to load drivers:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filter by tab
  const tabFilteredDrivers = drivers.filter((driver) => {
    if (filterTab === "all") return true;
    if (filterTab === "active") return driver.status === "active";
    if (filterTab === "inactive") return driver.status === "inactive" || driver.status === "suspended" || driver.status === "on_leave";
    if (filterTab === "pending") return driver.status === "inactive" && driver.default_pay_percentage === 0;
    return true;
  });

  // Filter by search
  const filteredDrivers = tabFilteredDrivers.filter((driver) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      driver.first_name?.toLowerCase().includes(search) ||
      driver.last_name?.toLowerCase().includes(search) ||
      driver.email?.toLowerCase().includes(search) ||
      driver.phone?.includes(search)
    );
  });

  // Count pending approvals (inactive with 0% pay = new registration)
  const pendingCount = drivers.filter(d => d.status === "inactive" && d.default_pay_percentage === 0).length;

  const summaryCards = [
    { label: "Total Drivers", value: stats.total, icon: Users, color: "purple" },
    { label: "Active", value: stats.active, icon: Truck, color: "green" },
    { label: "Inactive/Suspended", value: stats.inactive, icon: Users, color: "slate" },
    { label: "Jobs This Week", value: stats.jobsThisWeek, icon: Calendar, color: "blue" },
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Drivers</h1>
          <p className="text-slate-600">Manage driver accounts and assignments</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-2 rounded-xl border-2 border-brand-purple-600 bg-white px-4 py-2.5 font-semibold text-brand-purple-600 transition-colors hover:bg-brand-purple-50"
          >
            {linkCopied ? (
              <>
                <Check className="h-5 w-5" />
                Link Copied!
              </>
            ) : (
              <>
                <Link2 className="h-5 w-5" />
                Copy Invite Link
              </>
            )}
          </button>
          <Link
            href="/admin/drivers/new"
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-green-700"
          >
            <UserPlus className="h-5 w-5" />
            Add New Driver
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
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
              <div className="text-2xl font-bold text-slate-900">{card.value}</div>
              <div className="text-sm text-slate-600">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterTab("all")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            filterTab === "all"
              ? "bg-brand-purple-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          All Drivers ({drivers.length})
        </button>
        <button
          onClick={() => setFilterTab("active")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            filterTab === "active"
              ? "bg-green-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Active ({stats.active})
        </button>
        <button
          onClick={() => setFilterTab("inactive")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            filterTab === "inactive"
              ? "bg-slate-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Inactive ({stats.inactive})
        </button>
        <button
          onClick={() => setFilterTab("pending")}
          className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            filterTab === "pending"
              ? "bg-amber-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Pending Approval
          {pendingCount > 0 && (
            <span className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
              filterTab === "pending" ? "bg-white text-amber-600" : "bg-amber-600 text-white"
            }`}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search drivers..."
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
          />
        </div>
      </div>

      {/* Drivers Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                  Pay %
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                  Total Jobs
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                  Earnings Owed
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-600">
                    {searchTerm ? "No drivers found" : "No drivers yet. Click 'Add New Driver' to get started."}
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => {
                  const isPending = driver.status === "inactive" && driver.default_pay_percentage === 0;
                  return (
                  <tr key={driver.id} className={`hover:bg-slate-50 ${isPending ? "bg-amber-50" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-purple-100 font-semibold text-brand-purple-700">
                          {driver.first_name?.[0]}{driver.last_name?.[0]}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {driver.first_name} {driver.last_name}
                          </div>
                          {driver.preferred_name && (
                            <div className="text-sm text-slate-500">
                              ({driver.preferred_name})
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{driver.phone}</div>
                      <div className="text-sm text-slate-500">{driver.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          isPending
                            ? "bg-amber-100 text-amber-700"
                            : driver.status === "active"
                            ? "bg-green-100 text-green-700"
                            : driver.status === "suspended"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isPending ? "Pending Approval" : DRIVER_STATUS_LABELS[driver.status as keyof typeof DRIVER_STATUS_LABELS]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-900">
                      {driver.default_pay_percentage}%
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-900">
                      {driver.job_count || 0}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                      £{(driver.earnings_owed || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/drivers/${driver.id}`}
                        className="text-sm font-medium text-brand-purple-600 hover:text-brand-purple-700"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
