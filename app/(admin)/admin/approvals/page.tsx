"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Kind = "job-extras" | "expenses" | "leave-requests";
const TABS: { kind: Kind; label: string }[] = [
  { kind: "job-extras", label: "Extras" },
  { kind: "expenses", label: "Expenses" },
  { kind: "leave-requests", label: "Time off" },
];
const KEY: Record<Kind, string> = { "job-extras": "extras", expenses: "expenses", "leave-requests": "requests" };

/* eslint-disable @typescript-eslint/no-explicit-any */
const driverName = (d: any) => (d ? d.preferred_name || [d.first_name, d.last_name].filter(Boolean).join(" ") : "");
function title(kind: Kind, item: any): string {
  if (kind === "job-extras") return `£${Number(item.amount).toFixed(2)} · ${item.description}`;
  if (kind === "expenses") return `£${Number(item.amount).toFixed(2)} · ${item.category}`;
  return `${item.start_date}${item.end_date && item.end_date !== item.start_date ? ` – ${item.end_date}` : ""}`;
}
function sub(kind: Kind, item: any): string {
  const d = driverName(item.driver);
  if (kind === "job-extras") return [d, item.booking?.reference].filter(Boolean).join(" · ");
  if (kind === "expenses") return [d, item.note].filter(Boolean).join(" · ");
  return [d, item.reason].filter(Boolean).join(" · ");
}

/** Approvals — pending job extras / expenses / time-off with approve/reject. */
export default function ApprovalsPage() {
  const [tab, setTab] = useState<Kind>("job-extras");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (kind: Kind) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${kind}?status=pending`, { cache: "no-store" });
      const json = await res.json();
      setItems((json[KEY[kind]] as any[]) ?? []);
    } catch { setItems([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(tab); }, [tab, load]);

  async function act(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/${tab}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || "Couldn't update");
      toast.success(status === "approved" ? "Approved" : "Rejected");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update");
    } finally { setBusyId(null); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Approvals</h2>
        <p className="text-sm text-slate-500">Pending items awaiting your decision.</p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t.kind} onClick={() => setTab(t.kind)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${tab === t.kind ? "bg-brand-purple-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <CheckCheck className="mb-2 h-10 w-10 text-slate-200" />
          <p className="font-semibold text-slate-600">Nothing pending</p>
          <p className="text-sm text-slate-400">Approved or rejected items don&apos;t show here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-900">{title(tab, item)}</p>
              {sub(tab, item) && <p className="mt-0.5 text-sm text-slate-500">{sub(tab, item)}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => act(item.id, "approved")} disabled={busyId === item.id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-green-600 py-2 text-sm font-bold text-white hover:bg-brand-green-500 disabled:opacity-50">
                  {busyId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Approve
                </button>
                <button onClick={() => act(item.id, "rejected")} disabled={busyId === item.id}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
