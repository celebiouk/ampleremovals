"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface AnyvanBooking {
  id: string;
  reference: string;
  move_date: string | null;
  move_time: string | null;
  status: string;
}

/**
 * AnyVan jobs — work handled through AnyVan that never touches this system as
 * a real booking. Reuses `bookings` (is_anyvan: true) so the existing driver
 * assignment / accept-decline / driver-app machinery works unchanged — see
 * app/api/admin/anyvan-jobs/route.ts and the plan notes in
 * supabase/migrations/add_anyvan_jobs.sql.
 */
export default function AnyvanJobsPage() {
  const [jobs, setJobs] = useState<AnyvanBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("bookings")
        .select("id, reference, move_date, move_time, status")
        .eq("is_anyvan", true)
        .order("move_date", { ascending: false })
        .limit(100);
      setJobs(data ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!date) { toast.error("Pick a date"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/anyvan-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time: time || null }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`AnyVan job ${data.booking.reference} created`);
        setDate(""); setTime(""); setShowForm(false);
        load();
      } else toast.error(data.error || "Failed to create job");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Package className="h-6 w-6 text-brand-purple-700" /> AnyVan Jobs</h1>
          <p className="text-sm text-slate-500">Work handled through AnyVan — no customer or invoice, just a date/time and who's assigned.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 rounded-xl bg-brand-purple-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-purple-900">
          <Plus className="h-4 w-4" /> New AnyVan Job
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
            <button onClick={create} disabled={creating} className="flex items-center justify-center gap-2 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create job"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">After creating, open the job to assign a driver and porter — each gets a flat amount you set (defaults: £150 driver / £100 porter per day).</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" /></div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">No AnyVan jobs yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/bookings/${j.id}`} className="font-medium text-brand-purple-700 hover:underline">{j.reference}</Link>
                  </td>
                  <td className="px-4 py-3">{j.move_date ?? "—"}</td>
                  <td className="px-4 py-3">{j.move_time ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{j.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
