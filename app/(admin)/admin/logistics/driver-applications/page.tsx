"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { statusLabel, DRIVER_APPLICATION_STATUSES } from "@/lib/logistics";

interface ApplicationRow {
  id: string;
  reference: string;
  full_name: string;
  town_city: string;
  licence_category: string;
  experience_years: string | null;
  availability: string | null;
  status: string;
  created_at: string;
}

function StatusPill({ status }: { status: string }) {
  const good = status === "active_driver" || status === "approved_for_consideration";
  const dead = status === "rejected" || status === "withdrawn" || status === "inactive";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${good ? "bg-green-100 text-green-700" : dead ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
      {statusLabel(status)}
    </span>
  );
}

export default function DriverApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRow[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    const res = await fetch(`/api/admin/logistics/driver-applications${qs}`);
    const data = await res.json();
    if (data.success) setApplications(data.applications);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Ample Logistics — Driver Applications</h1>
          <p className="text-sm text-slate-500">HGV driver registrations submitted via amplelogistics.co.uk</p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {DRIVER_APPLICATION_STATUSES.map((s) => (<option key={s} value={s}>{statusLabel(s)}</option>))}
        </select>
      </div>

      {applications === null ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : applications.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">No driver applications yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Licence</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3"><Link href={`/admin/logistics/driver-applications/${a.id}`} className="font-semibold text-blue-700 hover:underline">{a.reference}</Link></td>
                  <td className="px-4 py-3 font-medium text-slate-900">{a.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{a.town_city}</td>
                  <td className="px-4 py-3 text-slate-600">{a.licence_category}</td>
                  <td className="px-4 py-3 text-slate-600">{a.experience_years ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{a.availability ?? "—"}</td>
                  <td className="px-4 py-3"><StatusPill status={a.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{new Date(a.created_at).toLocaleString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
