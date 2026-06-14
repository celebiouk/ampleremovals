"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Loader2, AlertTriangle, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DirectorLoanEntry } from "@/lib/bookkeeping";

interface LoanData {
  entries: DirectorLoanEntry[];
  balance: number;
  overdrawn: boolean;
  overdrawn_amount: number;
  s455_risk: boolean;
  over_10k: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function DirectorLoanPage() {
  const [data, setData] = useState<LoanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    direction: "director_to_company" as DirectorLoanEntry["direction"],
    amount: "",
    entry_date: today(),
    description: "",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/bookkeeping/director-loan");
      const json = await res.json();
      if (json.success) setData(json);
    } catch {
      toast.error("Failed to load director's loan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    const amount = parseFloat(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/bookkeeping/director-loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount }),
      });
      if ((await res.json()).success) {
        toast.success("Entry added");
        setShowForm(false);
        setForm({ direction: "director_to_company", amount: "", entry_date: today(), description: "" });
        load();
      } else toast.error("Failed to add entry");
    } catch {
      toast.error("Failed to add entry");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this entry?")) return;
    try {
      const res = await fetch(`/api/admin/bookkeeping/director-loan/${id}`, { method: "DELETE" });
      if ((await res.json()).success) { toast.success("Deleted"); load(); }
    } catch { toast.error("Failed to delete"); }
  }

  const balance = data?.balance ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Director&apos;s Loan</h1>
            <p className="mt-1 text-slate-600">Money you put into or take out of the company.</p>
          </div>
          <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700">
            <Plus className="h-4 w-4" /> Add entry
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>
        ) : (
          <>
            {/* Balance */}
            <div className={`mb-4 rounded-lg border p-5 ${balance >= 0 ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
              <p className="text-sm font-medium text-slate-600">Current balance</p>
              <p className={`mt-1 text-3xl font-bold ${balance >= 0 ? "text-green-700" : "text-amber-700"}`}>
                {formatCurrency(Math.abs(balance))}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {balance >= 0
                  ? "The company owes you (credit balance — repayable to you tax-free)."
                  : "You owe the company (overdrawn — see warnings below)."}
              </p>
            </div>

            {/* Warnings */}
            {data?.s455_risk && (
              <div className="mb-2 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold">Overdrawn director&apos;s loan — s455 risk</p>
                  <p>If not repaid within <strong>9 months &amp; 1 day</strong> of your year-end, the company pays <strong>s455 tax (33.75%)</strong> on the outstanding {formatCurrency(data.overdrawn_amount)} (refundable once repaid).</p>
                </div>
              </div>
            )}
            {data?.over_10k && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold">Over £10,000 overdrawn — benefit-in-kind</p>
                  <p>An overdrawn loan above £10,000 is a taxable benefit (P11D) unless you charge HMRC&apos;s official rate of interest. Speak to your accountant.</p>
                </div>
              </div>
            )}

            {/* Add form */}
            {showForm && (
              <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex gap-2">
                  <button onClick={() => setForm({ ...form, direction: "director_to_company" })} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${form.direction === "director_to_company" ? "border-green-500 bg-green-50 text-green-700" : "border-slate-300 text-slate-600"}`}>
                    I put money in
                  </button>
                  <button onClick={() => setForm({ ...form, direction: "company_to_director" })} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${form.direction === "company_to_director" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-300 text-slate-600"}`}>
                    I took money out
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Amount (£)</span>
                    <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Date</span>
                    <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">Description (optional)</span>
                    <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={save} disabled={saving} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">{saving ? "Saving…" : "Save entry"}</button>
                  <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">Cancel</button>
                </div>
              </div>
            )}

            {/* Ledger */}
            {(data?.entries.length ?? 0) === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-600">No entries yet.</div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold text-slate-900">
                      <th className="px-4 py-3">Date</th><th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Description</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.entries.map((e) => {
                      const inward = e.direction === "director_to_company";
                      return (
                        <tr key={e.id} className="text-sm hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600">{formatDate(e.entry_date)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 font-medium ${inward ? "text-green-700" : "text-amber-700"}`}>
                              {inward ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                              {inward ? "Put in" : "Took out"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{e.description || "—"}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${inward ? "text-green-600" : "text-amber-600"}`}>
                            {inward ? "+" : "−"}{formatCurrency(Number(e.amount))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => remove(e.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
