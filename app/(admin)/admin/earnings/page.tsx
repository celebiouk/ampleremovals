/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, PoundSterling, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { EARNINGS_STATUS_LABELS, EARNINGS_STATUS_COLORS } from "@/lib/constants";

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    loadEarnings();
  }, []);

  async function loadEarnings() {
    try {
      const response = await fetch("/api/admin/earnings");
      const data = await response.json();

      if (data.success) {
        setEarnings(data.earnings || []);
      }
    } catch (error) {
      console.error("Failed to load earnings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function approveEarning(earningId: string) {
    setApproving(earningId);
    try {
      const response = await fetch(`/api/admin/earnings/${earningId}/approve`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Earnings approved! Driver notified by email.");
        loadEarnings();
      } else {
        toast.error("Failed to approve earnings");
      }
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve earnings");
    } finally {
      setApproving(null);
    }
  }

  async function markPaid(earningId: string) {
    setPaying(earningId);
    try {
      const response = await fetch(`/api/admin/earnings/${earningId}/pay`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Marked as paid!");
        loadEarnings();
      } else {
        toast.error("Failed to mark as paid");
      }
    } catch (error) {
      console.error("Pay error:", error);
      toast.error("Failed to mark as paid");
    } finally {
      setPaying(null);
    }
  }

  const pendingEarnings = earnings.filter((e) => e.status === "pending");
  const approvedEarnings = earnings.filter((e) => e.status === "approved");
  const paidEarnings = earnings.filter((e) => e.status === "paid");

  const totalPending = pendingEarnings.reduce((sum, e) => sum + e.total_earnings, 0);
  const totalApproved = approvedEarnings.reduce((sum, e) => sum + e.total_earnings, 0);
  const totalPaid = paidEarnings.reduce((sum, e) => sum + e.total_earnings, 0);

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Driver Earnings</h1>
        <p className="text-slate-600">Approve and manage driver payment</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">£{totalPending.toFixed(2)}</div>
            <div className="text-sm text-slate-600">Pending Approval ({pendingEarnings.length})</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">£{totalApproved.toFixed(2)}</div>
            <div className="text-sm text-slate-600">Approved ({approvedEarnings.length})</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <PoundSterling className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">£{totalPaid.toFixed(2)}</div>
            <div className="text-sm text-slate-600">Paid Out ({paidEarnings.length})</div>
          </div>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Booking
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                  Pay %
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
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {earnings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-600">
                    No earnings records yet. Earnings are calculated when invoices are paid.
                  </td>
                </tr>
              ) : (
                earnings.map((earning) => (
                  <tr key={earning.id} className={earning.status === "pending" ? "bg-amber-50" : ""}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {earning.driver?.first_name} {earning.driver?.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{earning.booking?.reference}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-900">
                      {earning.pay_percentage}%
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-900">
                      £{earning.gross_earnings.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-900">
                      £{earning.tip_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                      £{earning.total_earnings.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          EARNINGS_STATUS_COLORS[earning.status as keyof typeof EARNINGS_STATUS_COLORS]
                        }`}
                      >
                        {EARNINGS_STATUS_LABELS[earning.status as keyof typeof EARNINGS_STATUS_LABELS]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {earning.status === "pending" && (
                        <button
                          onClick={() => approveEarning(earning.id)}
                          disabled={approving === earning.id}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          {approving === earning.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Approve
                            </>
                          )}
                        </button>
                      )}
                      {earning.status === "approved" && (
                        <button
                          onClick={() => markPaid(earning.id)}
                          disabled={paying === earning.id}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          {paying === earning.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <PoundSterling className="h-4 w-4" />
                              Mark as Paid
                            </>
                          )}
                        </button>
                      )}
                      {earning.status === "paid" && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                          <Check className="h-4 w-4" />
                          Paid
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
