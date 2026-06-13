"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Calendar, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const STATUS_FILTERS = ["all", "draft", "finalised", "paid", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

interface PayRun {
  id: string;
  reference: string;
  period_start: string;
  period_end: string;
  status: "draft" | "finalised" | "paid" | "cancelled";
  created_at: string;
  payslips: Array<{ count?: number }>;
}

export default function PayrollPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<PayRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [showNewRun, setShowNewRun] = useState(false);

  // Advanced filtering & search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    loadRuns();
  }, []);

  const filteredRuns = useMemo(() => {
    const q = search.trim().toLowerCase();
    return runs.filter((run) => {
      if (statusFilter !== "all" && run.status !== statusFilter) return false;
      if (q && !run.reference.toLowerCase().includes(q)) return false;
      // Date-range overlaps the run's period.
      if (fromDate && run.period_end < fromDate) return false;
      if (toDate && run.period_start > toDate) return false;
      return true;
    });
  }, [runs, search, statusFilter, fromDate, toDate]);

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || fromDate !== "" || toDate !== "";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  }

  async function loadRuns() {
    try {
      const response = await fetch("/api/admin/pay-runs");
      const data = await response.json();
      if (data.success) {
        setRuns(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load runs:", error);
      toast.error("Failed to load pay runs");
    } finally {
      setLoading(false);
    }
  }

  async function createRun() {
    if (!periodStart || !periodEnd) {
      toast.error("Please select both start and end dates");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/pay-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodStart,
          periodEnd,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Pay run ${data.data.reference} created with ${data.data.payslips.length} payslips`);
        setShowNewRun(false);
        setPeriodStart("");
        setPeriodEnd("");
        loadRuns();
      } else {
        toast.error(data.error || "Failed to create pay run");
      }
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Failed to create pay run");
    } finally {
      setCreating(false);
    }
  }

  const statusColors = {
    draft: "bg-slate-100 text-slate-700",
    finalised: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payroll</h1>
            <p className="mt-1 text-slate-600">Manage pay runs and worker payslips</p>
          </div>
          <Button
            onClick={() => setShowNewRun(!showNewRun)}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            New pay run
          </Button>
        </div>

        {/* New Run Form */}
        {showNewRun && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Create Pay Run</h2>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700">Period Start</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700">Period End</label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={createRun}
                  disabled={creating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
                <Button
                  onClick={() => setShowNewRun(false)}
                  variant="outline"
                  className="text-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filter bar */}
        {runs.length > 0 && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-4">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reference (e.g. PR-2026-0007)"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  <X className="h-4 w-4" /> Clear
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    statusFilter === s
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Runs List */}
        {runs.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No pay runs yet</h3>
            <p className="mt-2 text-slate-600">Create your first pay run to get started</p>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No matching pay runs</h3>
            <p className="mt-2 text-slate-600">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => router.push(`/admin/payroll/${run.id}`)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-purple-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900">{run.reference}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[run.status]}`}>
                        {run.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {new Date(run.period_start).toLocaleDateString()} –{" "}
                      {new Date(run.period_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">
                      {run.payslips?.length || 0} workers
                    </div>
                    <p className="text-xs text-slate-600">
                      {new Date(run.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
