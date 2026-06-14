"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Download, Info, CheckCircle2, Bell } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TaxTask {
  id: string;
  task_type: "corporation_tax" | "confirmation_statement";
  period_label: string;
  due_date: string | null;
  status: "pending" | "done";
}

const TASK_LABEL: Record<string, string> = {
  corporation_tax: "Corporation tax",
  confirmation_statement: "Confirmation statement",
};

interface YearEnd {
  period_label: string;
  period_start: string;
  period_end: string;
  vat_registered: boolean;
  revenue: number;
  other_income: number;
  wages: number;
  expenses: number;
  estimated_profit: number;
  estimated_corporation_tax: number;
  capital_total: number;
  capital_items: Array<{ date: string; label: string | null; description: string | null; amount: number }>;
}

export default function YearEndPage() {
  const now = new Date().getFullYear();
  const [year, setYear] = useState(now);
  const [data, setData] = useState<YearEnd | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaxTask[]>([]);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/bookkeeping/tax-tasks");
      const json = await res.json();
      if (json.success) setTasks(json.tasks);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function markDone(task: TaxTask) {
    const done = task.status !== "done";
    try {
      const res = await fetch(`/api/admin/bookkeeping/tax-tasks/${task.id}/done`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if ((await res.json()).success) {
        toast.success(done ? "Marked done — reminders stopped" : "Reopened");
        loadTasks();
      }
    } catch { toast.error("Failed to update"); }
  }

  const load = useCallback(async (y: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookkeeping/year-end?year=${y}`);
      const json = await res.json();
      if (json.success) setData(json.yearEnd);
      else toast.error(json.error || "Failed to load");
    } catch {
      toast.error("Failed to load year-end summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(year); }, [year, load]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Year-End Tax</h1>
            <p className="mt-1 text-slate-600">Corporation-tax estimate for your accounting period.</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {[now, now - 1, now - 2].map((y) => <option key={y} value={y}>Year to {y}</option>)}
            </select>
            <a href={`/api/admin/bookkeeping/year-end/export?year=${year}`} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
              <Download className="h-4 w-4" /> Download pack (CSV)
            </a>
          </div>
        </div>

        {/* Filing checklist (reminders stop when marked done) */}
        {tasks.length > 0 && (
          <div className="mb-6 space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className={`flex items-center justify-between rounded-lg border p-4 ${t.status === "done" ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center gap-3">
                  {t.status === "done" ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Bell className="h-5 w-5 text-amber-500" />}
                  <div>
                    <p className="font-medium text-slate-900">{TASK_LABEL[t.task_type]} <span className="text-slate-400">· {t.period_label}</span></p>
                    <p className="text-xs text-slate-500">
                      {t.status === "done" ? "Done — reminders off" : t.due_date ? `Due ${formatDate(t.due_date)} · reminders active` : "Reminders active"}
                    </p>
                  </div>
                </div>
                <button onClick={() => markDone(t)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${t.status === "done" ? "border border-slate-300 text-slate-600" : "bg-green-600 text-white hover:bg-green-700"}`}>
                  {t.status === "done" ? "Reopen" : "Mark as done"}
                </button>
              </div>
            ))}
          </div>
        )}

        {loading || !data ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">
              Accounting period: <strong>{formatDate(data.period_start)} – {formatDate(data.period_end)}</strong>
              {data.vat_registered ? " · figures shown ex-VAT" : ""}
            </p>

            {/* Breakdown */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <Line label="Revenue (paid invoices)" value={data.revenue} />
              <Line label="Other income" value={data.other_income} />
              <Line label="Less: wages (paid payslips)" value={-data.wages} />
              <Line label="Less: expenses (excl. capital)" value={-data.expenses} />
              <div className="my-3 border-t border-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-900">Estimated profit</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(data.estimated_profit)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-purple-50 px-4 py-3">
                <span className="font-semibold text-purple-800">Estimated corporation tax</span>
                <span className="text-2xl font-bold text-purple-700">{formatCurrency(data.estimated_corporation_tax)}</span>
              </div>
            </div>

            {/* Capital purchases */}
            {data.capital_items.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-800">Capital purchases — {formatCurrency(data.capital_total)}</p>
                <p className="text-sm text-amber-700">Excluded from the profit estimate above. Your accountant applies capital allowances (e.g. AIA on vans).</p>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {data.capital_items.map((c, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{formatDate(c.date)} · {c.label}{c.description ? ` (${c.description})` : ""}</span>
                      <span className="font-semibold">{formatCurrency(c.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" />
              <p className="text-sm text-slate-600">
                <strong>Estimate only.</strong> This organises your data and approximates corporation tax (FY2023+ rates with marginal relief). Your accountant applies capital allowances, disallowable items and accruals, and files the CT600. Download the pack above to hand them everything.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-medium ${value < 0 ? "text-red-600" : "text-slate-900"}`}>{formatCurrency(value)}</span>
    </div>
  );
}
