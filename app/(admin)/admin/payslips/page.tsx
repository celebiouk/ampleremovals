"use client";

import { useEffect, useState, useCallback } from "react";
import { Banknote, Clock, Loader2, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Payslip {
  id: string;
  net_pay: number;
  status: string;
  created_at: string;
  pay_run?: { reference?: string } | null;
}
interface Totals { paid: number; pending: number; total: number }

/**
 * My Payslips — the signed-in worker's own payslips (drivers/cleaners who also
 * use the admin). Mirrors the mobile screen; both call /api/worker/payslips.
 * A pure admin (not a worker) sees the "no payslips" state.
 */
export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [totals, setTotals] = useState<Totals>({ paid: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [notWorker, setNotWorker] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/worker/payslips", { cache: "no-store" });
      const json = await res.json();
      if (json.success === false) { setNotWorker(true); return; }
      setPayslips((json.payslips ?? []) as Payslip[]);
      setTotals(json.totals ?? { paid: 0, pending: 0, total: 0 });
      setNotWorker(false);
    } catch { setNotWorker(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">My Payslips</h2>
        <p className="text-sm text-slate-500">Your own payslips as a driver or cleaner.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : notWorker ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <FileText className="mb-2 h-10 w-10 text-slate-200" />
          <p className="font-semibold text-slate-600">No payslips</p>
          <p className="text-sm text-slate-400">This account isn&apos;t set up as a driver or cleaner, so there are no personal payslips.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-green-50 to-white border border-green-100 p-4">
              <div className="flex items-center gap-2 text-green-700"><Banknote className="h-4 w-4" /><span className="text-sm font-medium">Paid</span></div>
              <p className="mt-1 font-display text-2xl font-bold text-green-700">{formatCurrency(totals.paid)}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-4">
              <div className="flex items-center gap-2 text-brand-purple-700"><Clock className="h-4 w-4" /><span className="text-sm font-medium">Pending</span></div>
              <p className="mt-1 font-display text-2xl font-bold text-brand-purple-700">{formatCurrency(totals.pending)}</p>
            </div>
          </div>

          {payslips.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center">
              <FileText className="mb-2 h-9 w-9 text-slate-200" /><p className="text-sm text-slate-400">No payslips yet — they&apos;ll appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">{payslips.length} payslip{payslips.length !== 1 ? "s" : ""}</p>
              {payslips.map((ps) => (
                <div key={ps.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{ps.pay_run?.reference || "Payslip"}</p>
                    <p className="text-xs text-slate-500">{new Date(ps.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-brand-purple-700">{formatCurrency(ps.net_pay)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ps.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{ps.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
