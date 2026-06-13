"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, CheckCheck, Loader2, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { PayslipDetailDrawer } from "@/components/admin/payroll/PayslipDetailDrawer";

interface Payslip {
  id: string;
  worker_id: string;
  worker_type: string;
  worker_name?: string;
  gross_earnings: number;
  tips_total: number;
  adjustments_total: number;
  net_pay: number;
  status: "pending" | "paid";
  paid_at?: string;
  payment_method?: string;
}

interface PayRun {
  id: string;
  reference: string;
  period_start: string;
  period_end: string;
  status: string;
  payslips: Payslip[];
}

interface Totals {
  gross: number;
  tips: number;
  adjustments: number;
  net: number;
  pending: number;
  paid: number;
}

export default function PayRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;

  const [run, setRun] = useState<PayRun | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingAll, setPayingAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [finalising, setFinalising] = useState(false);
  const [openPayslipId, setOpenPayslipId] = useState<string | null>(null);
  const [payslipSearch, setPayslipSearch] = useState("");
  const [payslipStatus, setPayslipStatus] = useState<"all" | "pending" | "paid">("all");

  useEffect(() => {
    loadRunDetail();
  }, [runId]);

  async function loadRunDetail() {
    try {
      const response = await fetch(`/api/admin/pay-runs/${runId}`);
      const data = await response.json();
      if (data.success) {
        setRun(data.data.run);
        setTotals(data.data.totals);
      } else {
        toast.error("Failed to load pay run");
        router.push("/admin/payroll");
      }
    } catch (error) {
      console.error("Failed to load run detail:", error);
      toast.error("Failed to load pay run");
      router.push("/admin/payroll");
    } finally {
      setLoading(false);
    }
  }

  async function payAll() {
    if (!window.confirm("Mark all payslips as paid? This will update all linked earnings.")) return;

    setPayingAll(true);
    try {
      const response = await fetch(`/api/admin/pay-runs/${runId}/pay-all`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "bank_transfer" }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Marked ${data.data.payslipsCount} payslips as paid`);
        loadRunDetail();
      } else {
        toast.error(data.error || "Failed to mark payslips as paid");
      }
    } catch (error) {
      console.error("Pay all error:", error);
      toast.error("Failed to mark payslips as paid");
    } finally {
      setPayingAll(false);
    }
  }

  async function exportCSV() {
    try {
      const response = await fetch(`/api/admin/pay-runs/${runId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payroll-${run?.reference}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("CSV exported successfully");
      } else {
        toast.error("Failed to export CSV");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  }

  async function finaliseRun() {
    if (!window.confirm("Finalise this pay run? It will be locked and cannot be edited.")) return;

    setFinalising(true);
    try {
      const response = await fetch(`/api/admin/pay-runs/${runId}/finalise`, {
        method: "PATCH",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Pay run finalised");
        loadRunDetail();
      } else {
        toast.error(data.error || "Failed to finalise pay run");
      }
    } catch (error) {
      console.error("Finalise error:", error);
      toast.error("Failed to finalise pay run");
    } finally {
      setFinalising(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!run || !totals) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-semibold text-red-900">Pay run not found</h3>
      </div>
    );
  }

  const psQuery = payslipSearch.trim().toLowerCase();
  const visiblePayslips = run.payslips.filter((p) => {
    if (payslipStatus !== "all" && p.status !== payslipStatus) return false;
    if (psQuery) {
      const name = (p.worker_name ?? p.worker_id).toLowerCase();
      if (!name.includes(psQuery)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin/payroll")}
            className="mb-4 flex items-center gap-2 text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to payroll
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{run.reference}</h1>
              <p className="mt-1 text-slate-600">
                {new Date(run.period_start).toLocaleDateString()} –{" "}
                {new Date(run.period_end).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              {run.status === "draft" && (
                <Button
                  onClick={finaliseRun}
                  disabled={finalising}
                  variant="outline"
                  className="gap-2"
                >
                  {finalising ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalise"}
                </Button>
              )}
              <Button
                onClick={() => {
                  setExporting(true);
                  exportCSV();
                }}
                disabled={exporting}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export CSV"}
              </Button>
              <Button
                onClick={payAll}
                disabled={payingAll || totals.pending === 0}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCheck className="h-4 w-4" />
                {payingAll ? "Processing..." : "Pay all"}
              </Button>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-slate-600">Gross Earnings</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totals.gross)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-slate-600">Tips</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totals.tips)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-slate-600">Adjustments</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totals.adjustments)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-slate-600">Net Pay</div>
            <div className="mt-2 text-2xl font-bold text-purple-600">{formatCurrency(totals.net)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-slate-600">Status</div>
            <div className="mt-2 text-sm font-semibold">
              <span className="text-green-600">{totals.paid} paid</span> /{" "}
              <span className="text-amber-600">{totals.pending} pending</span>
            </div>
          </div>
        </div>

        {/* Payslip filter bar */}
        {run.payslips.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={payslipSearch}
                onChange={(e) => setPayslipSearch(e.target.value)}
                placeholder="Search worker"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "pending", "paid"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setPayslipStatus(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    payslipStatus === s
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payslips Table */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Worker</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Gross</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Tips</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Adjustments</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Net Pay</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visiblePayslips.map((payslip) => (
                  <tr
                    key={payslip.id}
                    onClick={() => setOpenPayslipId(payslip.id)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {payslip.worker_name ??
                        `${payslip.worker_type === "driver" ? "Driver" : "Cleaner"} ${payslip.worker_id.slice(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-900">
                      {formatCurrency(payslip.gross_earnings)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-900">
                      {formatCurrency(payslip.tips_total)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-900">
                      {formatCurrency(payslip.adjustments_total)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-purple-600">
                      {formatCurrency(payslip.net_pay)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        payslip.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {payslip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          Tap a worker row to manage their payslip — adjustments, mark paid, or download PDF.
        </p>
      </div>

      <PayslipDetailDrawer
        payslipId={openPayslipId}
        locked={run.status === "paid" || run.status === "cancelled"}
        onClose={() => setOpenPayslipId(null)}
        onChanged={loadRunDetail}
      />
    </div>
  );
}
