"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Calendar, Info } from "lucide-react";
import { toast } from "sonner";

interface Run {
  id: string;
  reference: string | null;
  tax_year: string;
  period_no: number;
  pay_date: string;
  status: string;
  paye_payslips?: Array<{ count?: number }>;
}

const CURRENT_TAX_YEAR = "2026-27";

// Tax week number for a date (weeks run from 6 April).
function taxWeekFor(dateStr: string): number {
  const d = new Date(dateStr);
  const year = d.getMonth() < 3 || (d.getMonth() === 3 && d.getDate() < 6) ? d.getFullYear() - 1 : d.getFullYear();
  const start = new Date(Date.UTC(year, 3, 6));
  const diff = Math.floor((d.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000));
  return Math.min(52, Math.max(1, diff + 1));
}

export default function PayeRunsPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [payDate, setPayDate] = useState(today);
  const [periodNo, setPeriodNo] = useState(taxWeekFor(today));

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/paye/pay-runs");
      const data = await res.json();
      if (data.success) setRuns(data.runs);
    } catch { toast.error("Failed to load pay runs"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/paye/pay-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tax_year: CURRENT_TAX_YEAR, period_no: periodNo, pay_date: payDate }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Run created — ${data.payslips} payslips`);
        router.push(`/admin/paye/${data.id}`);
      } else toast.error(data.error || "Failed to create run");
    } catch { toast.error("Failed to create run"); }
    finally { setCreating(false); }
  }

  const statusColor: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700", finalised: "bg-blue-100 text-blue-700", paid: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">PAYE Pay Runs</h1>
            <p className="mt-1 text-slate-600">Weekly payroll for {CURRENT_TAX_YEAR}.</p>
          </div>
          <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700">
            <Plus className="h-4 w-4" /> New weekly run
          </button>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Before you rely on this for real wages:</strong> run one cycle in parallel with HMRC&apos;s free
            <strong> Basic PAYE Tools</strong> and check the figures match. After each run, submit the RTI (FPS) to HMRC via Basic PAYE Tools using the figures on the run page.
          </p>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Pay date</span>
                <input type="date" value={payDate} onChange={(e) => { setPayDate(e.target.value); setPeriodNo(taxWeekFor(e.target.value)); }} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Tax week (1–52)</span>
                <input type="number" min={1} max={52} value={periodNo} onChange={(e) => setPeriodNo(parseInt(e.target.value, 10) || 1)} className="mt-1 block w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <button onClick={create} disabled={creating} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">
                {creating ? "Creating…" : "Create & calculate"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Calculates every active employee. Salary staff = annual ÷ 52; set hourly staff&apos;s hours on the run page.</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>
        ) : runs.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <Calendar className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-900">No pay runs yet</p>
            <p className="text-sm text-slate-600">Add employees, then create your first weekly run.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {runs.map((r) => (
              <button key={r.id} onClick={() => router.push(`/admin/paye/${r.id}`)} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-purple-300">
                <div>
                  <p className="font-semibold text-slate-900">{r.reference}</p>
                  <p className="text-sm text-slate-600">Week {r.period_no} · paid {new Date(r.pay_date).toLocaleDateString("en-GB")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">{r.paye_payslips?.[0]?.count ?? 0} payslips</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[r.status] ?? "bg-slate-100"}`}>{r.status}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
