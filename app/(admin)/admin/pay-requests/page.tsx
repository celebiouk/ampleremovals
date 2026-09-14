"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PoundSterling, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface PayRequest {
  id: string;
  work_date: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  approved_amount: number | null;
  created_at: string;
  driver: { id: string; first_name: string; last_name: string | null; preferred_name: string | null; account_type: string } | null;
}

/**
 * Manual pay requests — a driver/porter did work with no assignment already
 * in the system. Approving sets an amount, which creates a minimal AnyVan-
 * style booking + assignment + earnings row (see
 * app/api/admin/job-pay-requests/[id]/approve/route.ts).
 */
export default function PayRequestsPage() {
  const [requests, setRequests] = useState<PayRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/job-pay-requests");
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    const amount = parseFloat(amounts[id] ?? "");
    if (!Number.isFinite(amount) || amount < 0) { toast.error("Enter a valid amount"); return; }
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/job-pay-requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Approved"); load(); }
      else toast.error(data.error || "Failed to approve");
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/job-pay-requests/${id}/reject`, { method: "POST" });
      const data = await res.json();
      if (data.success) { toast.success("Rejected"); load(); }
      else toast.error(data.error || "Failed to reject");
    } finally {
      setBusy(null);
    }
  }

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><PoundSterling className="h-6 w-6 text-brand-purple-700" /> Pay Requests</h1>
        <p className="text-sm text-slate-500">Work a driver/porter did with no assignment already in the system — approve with an amount, or reject.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" /></div>
      ) : pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">No pending requests.</div>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {r.driver ? (r.driver.preferred_name || r.driver.first_name) : "Unknown"} {r.driver?.last_name ?? ""}
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-500">{r.driver?.account_type}</span>
                  </p>
                  <p className="text-sm text-slate-500">{r.work_date}</p>
                  <p className="mt-2 max-w-xl text-sm text-slate-700">{r.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" step="1" placeholder="£ amount"
                    value={amounts[r.id] ?? ""}
                    onChange={(e) => setAmounts((a) => ({ ...a, [r.id]: e.target.value }))}
                    className="h-9 w-28 rounded-lg border border-slate-200 px-3 text-sm"
                  />
                  <button onClick={() => approve(r.id)} disabled={busy === r.id} className="flex items-center gap-1 rounded-lg bg-brand-green-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
                    {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
                  </button>
                  <button onClick={() => reject(r.id)} disabled={busy === r.id} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-60">
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Decided</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr><th className="px-4 py-3">Worker</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {decided.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.driver ? (
                      <Link href={`/admin/drivers/${r.driver.id}`} className="text-brand-purple-700 hover:underline">
                        {r.driver.preferred_name || r.driver.first_name} {r.driver.last_name}
                      </Link>
                    ) : "—"}</td>
                    <td className="px-4 py-3">{r.work_date}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">{r.approved_amount != null ? `£${Number(r.approved_amount).toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
