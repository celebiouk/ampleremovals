"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Trash2, Loader2, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES, type BusinessExpense } from "@/lib/bookkeeping";

const today = () => new Date().toISOString().slice(0, 10);

export default function ExpensesPage() {
  const [rows, setRows] = useState<BusinessExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [vatRegistered, setVatRegistered] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [form, setForm] = useState({
    category: EXPENSE_CATEGORIES[0] as string,
    category_other: "",
    amount: "",
    vat_amount: "",
    expense_date: today(),
    supplier: "",
    is_capital: false,
    description: "",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/bookkeeping/expenses");
      const data = await res.json();
      if (data.success) setRows(data.expenses);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("settings").select("vat_registered").eq("id", 1).single();
      setVatRegistered(!!data?.vat_registered);
    })();
  }, [load]);

  const filtered = useMemo(
    () => (categoryFilter === "all" ? rows : rows.filter((r) => r.category === categoryFilter)),
    [rows, categoryFilter]
  );
  const total = useMemo(() => filtered.reduce((s, r) => s + Number(r.amount), 0), [filtered]);

  async function save() {
    const amount = parseFloat(form.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (form.category === "Other" && !form.category_other.trim()) {
      toast.error("Type the reason for 'Other'");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/bookkeeping/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          category_other: form.category_other || null,
          amount,
          vat_amount: vatRegistered ? parseFloat(form.vat_amount) || 0 : 0,
          expense_date: form.expense_date,
          supplier: form.supplier || null,
          is_capital: form.is_capital,
          description: form.description || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Expense added");
        setShowForm(false);
        setForm({ category: EXPENSE_CATEGORIES[0], category_other: "", amount: "", vat_amount: "", expense_date: today(), supplier: "", is_capital: false, description: "" });
        load();
      } else {
        toast.error(data.error || "Failed to add expense");
      }
    } catch {
      toast.error("Failed to add expense");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this expense?")) return;
    try {
      const res = await fetch(`/api/admin/bookkeeping/expenses/${id}`, { method: "DELETE" });
      if ((await res.json()).success) {
        setRows((r) => r.filter((x) => x.id !== id));
        toast.success("Deleted");
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>
            <p className="mt-1 text-slate-600">Company costs for your corporation-tax calculation.</p>
          </div>
          <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700">
            <Plus className="h-4 w-4" /> Add expense
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Category</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              {form.category === "Other" && (
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Reason (Other)</span>
                  <input value={form.category_other} onChange={(e) => setForm({ ...form, category_other: e.target.value })} placeholder="Type the reason" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
              )}
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Amount (£)</span>
                <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              {vatRegistered && (
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">VAT included (£)</span>
                  <input value={form.vat_amount} onChange={(e) => setForm({ ...form, vat_amount: e.target.value })} inputMode="decimal" placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
              )}
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Date</span>
                <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Supplier (optional)</span>
                <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_capital} onChange={(e) => setForm({ ...form, is_capital: e.target.checked })} />
              This is a capital purchase (van/equipment) — excluded from the profit estimate, handled by your accountant
            </label>
            <div className="mt-4 flex gap-2">
              <button onClick={save} disabled={saving} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">
                {saving ? "Saving…" : "Save expense"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">Cancel</button>
            </div>
          </div>
        )}

        {/* Filter + total */}
        <div className="mb-3 flex items-center justify-between">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">All categories</option>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-sm text-slate-600">Total: <span className="font-bold text-slate-900">{formatCurrency(total)}</span></p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <TrendingDown className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-900">No expenses yet</p>
            <p className="text-sm text-slate-600">Add your first expense to start tracking.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold text-slate-900">
                  <th className="px-4 py-3">Date</th><th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Supplier</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="text-sm hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{formatDate(r.expense_date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {r.category === "Other" ? r.category_other || "Other" : r.category}
                      {r.is_capital && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">capital</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.supplier || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(Number(r.amount))}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(r.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
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
