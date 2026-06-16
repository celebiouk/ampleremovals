/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Users, Trash2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

export default function PortersPage() {
  const [porters, setPorters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: "", default_day_rate: "" });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/porters");
      const data = await res.json();
      if (data.success) setPorters(data.porters);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function addPorter() {
    if (!form.first_name.trim()) { toast.error("First name is required"); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/porters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          default_day_rate: form.default_day_rate ? Number(form.default_day_rate) : 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Porter added");
        setForm({ first_name: "", last_name: "", phone: "", email: "", default_day_rate: "" });
        setShowForm(false);
        load();
      } else toast.error(data.error || "Failed to add porter");
    } finally {
      setAdding(false);
    }
  }

  async function removePorter(id: string, name: string) {
    if (!confirm(`Remove porter ${name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/porters/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Porter removed"); load(); }
    else toast.error(data.error || "Failed to remove");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Users className="h-6 w-6 text-brand-purple-700" /> Porters</h1>
          <p className="text-sm text-slate-500">Crew members who assist drivers on larger jobs.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 rounded-xl bg-brand-purple-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-purple-900">
          <Plus className="h-4 w-4" /> Add Porter
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name *" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
            <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
            <input value={form.default_day_rate} onChange={(e) => setForm({ ...form, default_day_rate: e.target.value })} placeholder="Day rate £" type="number" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={addPorter} disabled={adding} className="flex items-center gap-2 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save porter"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" /></div>
      ) : porters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">No porters yet. Add your first porter above.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {porters.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{p.first_name} {p.last_name}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
                </div>
                <button onClick={() => removePorter(p.id, p.first_name)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                {p.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> {p.phone}</p>}
                {p.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> {p.email}</p>}
                <p className="text-slate-500">£{Number(p.default_day_rate || 0).toFixed(2)}/day · {p.job_count} job{p.job_count === 1 ? "" : "s"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
