"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Check, Loader2, Phone, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SERVICE_LABELS_SHORT } from "@/lib/constants";
import type { ServiceType } from "@/types";

interface PendingDeposit {
  id: string;
  reference: string;
  service_type: ServiceType;
  move_date: string | null;
  created_at: string;
  deposit_amount: number | null;
  claimed: boolean;
  customer_name: string;
  customer_phone: string | null;
}

/**
 * "Deposits to confirm" — a dashboard action queue of every booking whose deposit
 * invoice is out but not yet verified. One tap arms a row, a second confirms the
 * money landed: it marks the booking confirmed and notifies the customer. Renders
 * nothing when there's nothing waiting, so it only shows up when there's work.
 *
 * `onConfirmed` lets the parent refresh its KPIs after a deposit is confirmed.
 */
export function DepositsToConfirm({ onConfirmed }: { onConfirmed?: () => void }) {
  const router = useRouter();
  const [items, setItems] = useState<PendingDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/deposits/pending");
      const json = await res.json();
      if (json.success) setItems(json.items as PendingDeposit[]);
    } catch {
      /* non-fatal — the widget just stays hidden */
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function confirm(id: string) {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/confirm-deposit`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success("Deposit confirmed — customer notified");
        setItems((prev) => prev.filter((i) => i.id !== id));
        onConfirmed?.();
      } else {
        toast.error(json.error || "Couldn't confirm the deposit");
      }
    } catch {
      toast.error("Couldn't confirm the deposit");
    } finally {
      setConfirmingId(null);
      setArmedId(null);
    }
  }

  // Nothing to show until there's actually work waiting.
  if (loading || items.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 shadow-sm">
      <div className="flex items-center justify-between border-b border-amber-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-amber-900">Deposits to confirm</h3>
            <p className="text-xs text-amber-700">Check your bank, then confirm to lock in the job.</p>
          </div>
        </div>
        <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">{items.length}</span>
      </div>

      <div className="divide-y divide-amber-100">
        {items.map((d) => {
          const armed = armedId === d.id;
          const busy = confirmingId === d.id;
          return (
            <div key={d.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/admin/bookings/${d.id}`)}
                    className="truncate text-sm font-semibold text-slate-800 hover:text-brand-purple-700 hover:underline"
                  >
                    {d.customer_name}
                  </button>
                  {d.claimed && (
                    <span className="shrink-0 rounded-full bg-brand-green-100 px-2 py-0.5 text-[11px] font-bold text-brand-green-800">
                      Says paid
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  <span className="font-mono">{d.reference}</span>
                  {" · "}{SERVICE_LABELS_SHORT[d.service_type] ?? d.service_type}
                  {d.move_date ? ` · moves ${formatDate(d.move_date)}` : ""}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">
                  {d.deposit_amount != null ? formatCurrency(d.deposit_amount) : "—"}
                </p>
                <p className="text-[11px] text-slate-400">deposit due</p>
              </div>

              {d.customer_phone && !armed && (
                <a
                  href={`tel:${d.customer_phone}`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-brand-green-600"
                  title={`Call ${d.customer_name}`}
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}

              {armed ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => confirm(d.id)}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-green-500 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Money&apos;s in — confirm
                  </button>
                  <button
                    onClick={() => setArmedId(null)}
                    disabled={busy}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setArmedId(d.id)}
                  className="flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm ring-1 ring-amber-300 hover:bg-amber-100"
                >
                  Confirm received <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
