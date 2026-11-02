"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, AlertTriangle } from "lucide-react";
import { statusLabel } from "@/lib/logistics";

interface RequestRow {
  id: string;
  reference: string;
  company_name: string;
  job_location: string;
  licence_category: string;
  drivers_required: number;
  start_date: string | null;
  urgency: string;
  status: string;
  created_at: string;
}

const URGENT_STATUSES = new Set(["immediate", "within_24_hours"]);

function UrgencyBadge({ urgency }: { urgency: string }) {
  const isUrgent = URGENT_STATUSES.has(urgency);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isUrgent ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
      }`}
    >
      {isUrgent && <AlertTriangle className="h-3 w-3" />}
      {statusLabel(urgency)}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const done = status === "completed";
  const dead = status === "cancelled" || status === "unable_to_fill";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        done ? "bg-green-100 text-green-700" : dead ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}

export default function DriverRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    const res = await fetch(`/api/admin/logistics/driver-requests${qs}`);
    const data = await res.json();
    if (data.success) setRequests(data.requests);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Ample Logistics — Business Requests</h1>
          <p className="text-sm text-slate-500">HGV driver staffing requests submitted via amplelogistics.co.uk</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {["new_request", "reviewing", "driver_search_in_progress", "driver_available", "confirmed", "completed", "cancelled", "unable_to_fill"].map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
      </div>

      {requests === null ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : requests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">No business requests yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Licence</th>
                <th className="px-4 py-3">Drivers</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/logistics/driver-requests/${r.id}`} className="font-semibold text-blue-700 hover:underline">{r.reference}</Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.company_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.job_location}</td>
                  <td className="px-4 py-3 text-slate-600">{r.licence_category}</td>
                  <td className="px-4 py-3 text-slate-600">{r.drivers_required}</td>
                  <td className="px-4 py-3 text-slate-600">{r.start_date ?? "—"}</td>
                  <td className="px-4 py-3"><UrgencyBadge urgency={r.urgency} /></td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{new Date(r.created_at).toLocaleString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
