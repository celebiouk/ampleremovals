"use client";

import { useEffect, useState } from "react";
import { Loader2, ExternalLink, Download, CheckCircle2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingReference: string;
  customerName: string;
  /** Pre-fills the amount field (e.g. the quote total or outstanding balance). */
  defaultAmount?: number | null;
  /** Called after a receipt is generated, so the parent can refresh activity. */
  onGenerated?: () => void;
}

const PAYMENT_METHODS = ["Bank Transfer", "Card", "Cash", "Other"];
const today = () => new Date().toISOString().slice(0, 10);

export function GenerateReceiptModal({
  isOpen, onClose, bookingId, bookingReference, customerName, defaultAmount, onGenerated,
}: Props) {
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [payDate, setPayDate] = useState(today);
  const [description, setDescription] = useState("");
  const [emailCustomer, setEmailCustomer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ receiptNumber: string; url: string; filename: string; emailed: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount && defaultAmount > 0 ? String(defaultAmount) : "");
      setMethod(PAYMENT_METHODS[0]); setPayDate(today()); setDescription("");
      setEmailCustomer(false); setError(""); setDone(null); setBusy(false);
    }
  }, [isOpen, defaultAmount]);

  // Free the object URL when the dialog closes so we don't leak blobs.
  useEffect(() => {
    return () => { if (done?.url) URL.revokeObjectURL(done.url); };
  }, [done]);

  const amountNum = Number(amount);

  async function generate() {
    if (!(amountNum > 0)) { setError("Enter the amount the customer paid."); return; }
    setError(""); setBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          paymentMethod: method,
          paymentDate: payDate,
          description: description.trim() || undefined,
          sendEmail: emailCustomer,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't generate the receipt.");

      // Turn the base64 PDF into a downloadable blob URL and open it.
      const bytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      setDone({ receiptNumber: data.receiptNumber, url, filename: data.filename, emailed: Boolean(data.emailed) });
      window.open(url, "_blank");
      toast.success(data.emailed ? "Receipt generated & emailed" : "Receipt generated");
      onGenerated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't generate the receipt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-brand-green-600" /> Generate Payment Receipt
          </DialogTitle>
          <p className="text-sm text-slate-500">{customerName} — {bookingReference}</p>
        </DialogHeader>

        {!done ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-brand-green-200 bg-brand-green-50 p-3 text-sm text-brand-green-800">
              Issue a receipt for a payment you&apos;ve received. It includes the customer&apos;s details, just like the invoice.
            </div>

            {/* Amount paid */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount paid</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                <input
                  type="number" min={0} step={0.01} value={amount} autoFocus
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-11 w-full rounded-xl border-2 border-slate-200 pl-7 pr-3 text-base outline-none focus:border-brand-green-500"
                />
              </div>
            </div>

            {/* Method + date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment method</label>
                <select
                  value={method} onChange={(e) => setMethod(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-green-500"
                >
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment date</label>
                <input
                  type="date" value={payDate} max={today()} onChange={(e) => setPayDate(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-slate-200 px-3 text-sm outline-none focus:border-brand-green-500"
                />
              </div>
            </div>

            {/* What it's for */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                What it&apos;s for <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder={`e.g. Removals — Booking ${bookingReference}`}
                className="h-11 w-full rounded-xl border-2 border-slate-200 px-3 text-sm outline-none focus:border-brand-green-500"
              />
            </div>

            {/* Email option */}
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <input type="checkbox" checked={emailCustomer} onChange={(e) => setEmailCustomer(e.target.checked)}
                className="h-4 w-4 accent-brand-green-600" />
              <span className="text-sm text-slate-700">Also email this receipt to the customer</span>
            </label>

            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={generate} disabled={busy || !(amountNum > 0)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green-600 py-2.5 text-sm font-bold text-white hover:bg-brand-green-500 disabled:opacity-50">
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <>Generate receipt · {amountNum > 0 ? formatCurrency(amountNum) : "£0.00"}</>}
              </button>
            </div>
          </div>
        ) : (
          /* Done state */
          <div className="space-y-5 py-2">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-green-200 bg-brand-green-50 p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-brand-green-600" />
              <h3 className="font-semibold text-brand-green-900">Receipt generated</h3>
              <p className="font-mono text-xl font-bold text-slate-800">{done.receiptNumber}</p>
              {done.emailed && <p className="text-sm text-brand-green-700">✓ Emailed to the customer</p>}
            </div>
            <div className="space-y-2">
              <a href={done.url} target="_blank" rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <ExternalLink className="h-4 w-4" /> View PDF
              </a>
              <a href={done.url} download={done.filename}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-800 py-3 text-sm font-bold text-white hover:bg-brand-purple-900">
                <Download className="h-4 w-4" /> Download
              </a>
              <button onClick={onClose} className="flex w-full items-center justify-center rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Done
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
