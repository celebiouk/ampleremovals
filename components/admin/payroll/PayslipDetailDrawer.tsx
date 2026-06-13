"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Download, CheckCheck, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface Adjustment {
  id: string;
  type: string;
  label: string;
  amount: number;
}

interface PayslipDetail {
  id: string;
  worker_id: string;
  worker_type: string;
  gross_earnings: number;
  tips_total: number;
  adjustments_total: number;
  net_pay: number;
  status: "pending" | "paid";
  paid_at?: string | null;
  payment_method?: string | null;
  payroll_adjustments: Adjustment[];
}

const ADJ_TYPES = ["bonus", "deduction", "advance", "expense"] as const;

/**
 * Slide-over drawer for managing a single payslip from the pay-run detail page.
 * Mirrors the mobile payslip screen (app/payslip/[id].tsx): breakdown, add/remove
 * adjustments, mark paid (method), and download PDF — using the same endpoints.
 */
export function PayslipDetailDrawer({
  payslipId,
  locked,
  onClose,
  onChanged,
}: {
  payslipId: string | null;
  /** When the run is finalised/paid we still allow viewing but hide mutating actions. */
  locked: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [payslip, setPayslip] = useState<PayslipDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [addingAdj, setAddingAdj] = useState(false);
  const [deletingAdj, setDeletingAdj] = useState<string | null>(null);

  const [showAdjForm, setShowAdjForm] = useState(false);
  const [adjType, setAdjType] = useState<(typeof ADJ_TYPES)[number]>("bonus");
  const [adjLabel, setAdjLabel] = useState("");
  const [adjAmount, setAdjAmount] = useState("");

  const load = useCallback(async () => {
    if (!payslipId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payslips/${payslipId}`);
      const data = await res.json();
      if (data.success) setPayslip(data.payslip);
      else toast.error(data.error || "Failed to load payslip");
    } catch {
      toast.error("Failed to load payslip");
    } finally {
      setLoading(false);
    }
  }, [payslipId]);

  useEffect(() => {
    if (payslipId) load();
    else {
      setPayslip(null);
      setShowAdjForm(false);
      setAdjLabel("");
      setAdjAmount("");
      setAdjType("bonus");
    }
  }, [payslipId, load]);

  async function markPaid(method: "bank_transfer" | "cash") {
    if (!payslipId) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/admin/payslips/${payslipId}/pay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: method }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payslip marked as paid");
        await load();
        onChanged();
      } else {
        toast.error(data.error || "Failed to mark as paid");
      }
    } catch {
      toast.error("Failed to mark as paid");
    } finally {
      setPaying(false);
    }
  }

  async function addAdjustment() {
    if (!payslipId) return;
    const amountNum = parseFloat(adjAmount);
    if (!adjLabel.trim() || !Number.isFinite(amountNum)) {
      toast.error("Enter a label and a numeric amount");
      return;
    }
    setAddingAdj(true);
    try {
      // Amount is in POUNDS, signed — negative for a deduction (same convention
      // as the mobile single-adjustment screen).
      const res = await fetch(`/api/admin/payslips/${payslipId}/adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: adjType, label: adjLabel.trim(), amount: amountNum }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Adjustment added");
        setAdjLabel("");
        setAdjAmount("");
        setAdjType("bonus");
        setShowAdjForm(false);
        await load();
        onChanged();
      } else {
        toast.error(data.error || "Failed to add adjustment");
      }
    } catch {
      toast.error("Failed to add adjustment");
    } finally {
      setAddingAdj(false);
    }
  }

  async function deleteAdjustment(adjId: string) {
    if (!payslipId) return;
    setDeletingAdj(adjId);
    try {
      const res = await fetch(`/api/admin/payslips/${payslipId}/adjustments/${adjId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({ success: res.ok }));
      if (res.ok && (data.success ?? true)) {
        toast.success("Adjustment removed");
        await load();
        onChanged();
      } else {
        toast.error(data.error || "Failed to remove adjustment");
      }
    } catch {
      toast.error("Failed to remove adjustment");
    } finally {
      setDeletingAdj(null);
    }
  }

  function viewPDF() {
    if (!payslipId) return;
    window.open(`/api/admin/payslips/${payslipId}/pdf`, "_blank", "noopener,noreferrer");
  }

  if (!payslipId) return null;

  const canMutate = !locked;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Payslip</h2>
            {payslip && (
              <p className="text-sm capitalize text-slate-500">
                {payslip.worker_type} · {payslip.worker_id.slice(0, 8)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {payslip && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  payslip.status === "paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {payslip.status}
              </span>
            )}
            <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading || !payslip ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand-purple-600" />
          </div>
        ) : (
          <div className="flex-1 space-y-6 p-6">
            {/* Breakdown */}
            <div className="rounded-xl border border-slate-200 p-4">
              <Row label="Gross earnings" value={formatCurrency(payslip.gross_earnings)} />
              <Row label="Tips" value={formatCurrency(payslip.tips_total)} />
              <Row label="Adjustments" value={formatCurrency(payslip.adjustments_total)} />
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-base font-semibold text-slate-900">Net pay</span>
                <span className="text-2xl font-bold text-brand-purple-700">
                  {formatCurrency(payslip.net_pay)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={viewPDF}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> View PDF
              </button>

              {canMutate && payslip.status === "pending" && (
                <>
                  <button
                    onClick={() => setShowAdjForm((s) => !s)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                  >
                    <Plus className="h-4 w-4" /> Add adjustment
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => markPaid("bank_transfer")}
                      disabled={paying}
                      className="flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                      Bank transfer
                    </button>
                    <button
                      onClick={() => markPaid("cash")}
                      disabled={paying}
                      className="flex items-center justify-center gap-2 rounded-lg border border-green-600 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"
                    >
                      <CheckCheck className="h-4 w-4" /> Cash
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Add-adjustment form */}
            {showAdjForm && canMutate && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  {ADJ_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setAdjType(t)}
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                        adjType === t
                          ? "bg-brand-purple-700 text-white"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  value={adjLabel}
                  onChange={(e) => setAdjLabel(e.target.value)}
                  placeholder="Label (e.g. Performance bonus)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  placeholder="Amount in £ (use −50 for a deduction)"
                  inputMode="decimal"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={addAdjustment}
                  disabled={addingAdj}
                  className="w-full rounded-lg bg-brand-purple-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-purple-800 disabled:opacity-60"
                >
                  {addingAdj ? "Adding…" : "Add adjustment"}
                </button>
              </div>
            )}

            {/* Existing adjustments */}
            {payslip.payroll_adjustments?.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Adjustments</h3>
                <div className="space-y-2">
                  {payslip.payroll_adjustments.map((adj) => (
                    <div
                      key={adj.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{adj.label}</p>
                        <p className="text-xs capitalize text-slate-500">{adj.type}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-semibold ${
                            adj.amount >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {adj.amount >= 0 ? "+" : ""}
                          {formatCurrency(adj.amount)}
                        </span>
                        {canMutate && (
                          <button
                            onClick={() => deleteAdjustment(adj.id)}
                            disabled={deletingAdj === adj.id}
                            className="rounded p-1 text-slate-300 hover:text-red-500 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
