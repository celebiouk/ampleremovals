"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Users, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { Employee } from "@/lib/paye/types";

const blank = {
  first_name: "", last_name: "", ni_number: "", tax_code: "1257L",
  tax_basis: "cumulative", date_of_birth: "", email: "", phone: "", address: "",
  start_date: new Date().toISOString().slice(0, 10), is_director: false,
  pay_basis: "salary", annual_salary: "", hourly_rate: "",
  student_loan_plan: "none", postgrad_loan: false,
  bank_sort_code: "", bank_account: "", status: "active",
};

export default function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ ...blank });

  const set = (k: string) => (v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/paye/employees");
      const data = await res.json();
      if (data.success) setRows(data.employees);
    } catch { toast.error("Failed to load employees"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setEditId(null); setForm({ ...blank }); setShowForm(true); }
  function openEdit(e: Employee) {
    setEditId(e.id);
    setForm({
      ...blank, ...e,
      ni_number: e.ni_number ?? "", date_of_birth: e.date_of_birth ?? "", email: e.email ?? "",
      phone: e.phone ?? "", address: e.address ?? "", start_date: e.start_date ?? "",
      annual_salary: String(e.annual_salary ?? ""), hourly_rate: String(e.hourly_rate ?? ""),
      bank_sort_code: e.bank_sort_code ?? "", bank_account: e.bank_account ?? "",
    });
    setShowForm(true);
  }

  async function save() {
    if (!String(form.first_name).trim() || !String(form.last_name).trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        annual_salary: parseFloat(String(form.annual_salary)) || 0,
        hourly_rate: parseFloat(String(form.hourly_rate)) || 0,
      };
      const res = await fetch(editId ? `/api/admin/paye/employees/${editId}` : "/api/admin/paye/employees", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if ((await res.json()).success) {
        toast.success(editId ? "Employee updated" : "Employee added");
        setShowForm(false); load();
      } else toast.error("Failed to save");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this employee? Their payslips will also be removed.")) return;
    try {
      const res = await fetch(`/api/admin/paye/employees/${id}`, { method: "DELETE" });
      if ((await res.json()).success) { toast.success("Deleted"); load(); }
    } catch { toast.error("Failed to delete"); }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
            <p className="mt-1 text-slate-600">PAYE staff &amp; directors on the payroll.</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700">
            <Plus className="h-4 w-4" /> Add employee
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">{editId ? "Edit employee" : "New employee"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name"><input value={String(form.first_name)} onChange={(e) => set("first_name")(e.target.value)} className={inp} /></Field>
              <Field label="Last name"><input value={String(form.last_name)} onChange={(e) => set("last_name")(e.target.value)} className={inp} /></Field>
              <Field label="NI number"><input value={String(form.ni_number)} onChange={(e) => set("ni_number")(e.target.value)} placeholder="QQ123456C" className={inp} /></Field>
              <Field label="Date of birth"><input type="date" value={String(form.date_of_birth)} onChange={(e) => set("date_of_birth")(e.target.value)} className={inp} /></Field>
              <Field label="Tax code"><input value={String(form.tax_code)} onChange={(e) => set("tax_code")(e.target.value.toUpperCase())} className={inp} /></Field>
              <Field label="Tax basis">
                <select value={String(form.tax_basis)} onChange={(e) => set("tax_basis")(e.target.value)} className={inp}>
                  <option value="cumulative">Cumulative</option>
                  <option value="week1month1">Week 1 / Month 1</option>
                </select>
              </Field>
              <Field label="Pay basis">
                <select value={String(form.pay_basis)} onChange={(e) => set("pay_basis")(e.target.value)} className={inp}>
                  <option value="salary">Annual salary</option>
                  <option value="hourly">Hourly</option>
                </select>
              </Field>
              {form.pay_basis === "salary" ? (
                <Field label="Annual salary (£)"><input value={String(form.annual_salary)} onChange={(e) => set("annual_salary")(e.target.value)} inputMode="decimal" className={inp} /></Field>
              ) : (
                <Field label="Hourly rate (£)"><input value={String(form.hourly_rate)} onChange={(e) => set("hourly_rate")(e.target.value)} inputMode="decimal" className={inp} /></Field>
              )}
              <Field label="Student loan">
                <select value={String(form.student_loan_plan)} onChange={(e) => set("student_loan_plan")(e.target.value)} className={inp}>
                  <option value="none">None</option><option value="plan1">Plan 1</option><option value="plan2">Plan 2</option>
                  <option value="plan4">Plan 4</option><option value="plan5">Plan 5</option>
                </select>
              </Field>
              <Field label="Start date"><input type="date" value={String(form.start_date)} onChange={(e) => set("start_date")(e.target.value)} className={inp} /></Field>
              <Field label="Email"><input value={String(form.email)} onChange={(e) => set("email")(e.target.value)} className={inp} /></Field>
              <Field label="Phone"><input value={String(form.phone)} onChange={(e) => set("phone")(e.target.value)} className={inp} /></Field>
              <Field label="Bank sort code"><input value={String(form.bank_sort_code)} onChange={(e) => set("bank_sort_code")(e.target.value)} placeholder="12-34-56" className={inp} /></Field>
              <Field label="Bank account"><input value={String(form.bank_account)} onChange={(e) => set("bank_account")(e.target.value)} className={inp} /></Field>
            </div>
            <div className="mt-3 flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!form.is_director} onChange={(e) => set("is_director")(e.target.checked)} /> Director (annual NI method)</label>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!form.postgrad_loan} onChange={(e) => set("postgrad_loan")(e.target.checked)} /> Postgraduate loan</label>
            </div>
            <p className="mt-3 text-xs text-slate-400">NI category A only in this version. Check the tax code matches HMRC&apos;s coding notice.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={save} disabled={saving} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-900">No employees yet</p>
            <p className="text-sm text-slate-600">Add your staff and director to run payroll.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold text-slate-900">
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Tax code</th><th className="px-4 py-3">Pay</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((e) => (
                  <tr key={e.id} className="text-sm hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{e.first_name} {e.last_name}{e.is_director && <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700">director</span>}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{e.tax_code}</td>
                    <td className="px-4 py-3 text-slate-600">{e.pay_basis === "salary" ? `${formatCurrency(e.annual_salary)}/yr` : `${formatCurrency(e.hourly_rate)}/hr`}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>{e.status}</span></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <a href={`/api/admin/paye/employees/${e.id}/p60`} target="_blank" rel="noreferrer" className="mr-3 text-xs font-medium text-purple-600 hover:underline">P60</a>
                      {e.status === "left" && <a href={`/api/admin/paye/employees/${e.id}/p45`} target="_blank" rel="noreferrer" className="mr-3 text-xs font-medium text-purple-600 hover:underline">P45</a>}
                      <button onClick={() => openEdit(e)} className="mr-3 text-slate-400 hover:text-purple-600"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(e.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
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

const inp = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}
