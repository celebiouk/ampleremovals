"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, ExternalLink, Send, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { SERVICE_LABELS_SHORT } from "@/lib/constants";
import type { ServiceType } from "@/types";

interface LineItem { description: string; quantity: number; unitPrice: number }

interface AdditionalServices {
  packing_services?: boolean;
  packing_materials?: boolean;
  disassemble_furniture?: boolean;
  assemble_furniture?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  type: "deposit" | "full_balance";
  bookingReference: string;
  customerName: string;
  serviceType: ServiceType;
  additionalServices?: AdditionalServices | null;
  quoteTotal?: number | null; // Quote total from booking
  onSuccess: (invoice: { id: string; invoiceNumber: string; total: number; pdfUrl: string; stripePaymentLink: string }) => void;
}

const defaultDueDate = () => {
  const d = new Date(); d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
};

export function GenerateInvoiceModal({ isOpen, onClose, bookingId, type, bookingReference, customerName, serviceType, additionalServices, quoteTotal, onSuccess }: Props) {
  const serviceLabel = SERVICE_LABELS_SHORT[serviceType];
  const typeLabel = type === "deposit" ? "Deposit" : "Full Balance";

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: `${typeLabel} — ${serviceLabel} Service`, quantity: 1, unitPrice: 0 },
  ]);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [notes, setNotes] = useState("");
  const [fullJobValue, setFullJobValue] = useState<number>(0);
  const [depositPercent, setDepositPercent] = useState<number>(25);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ id: string; invoiceNumber: string; total: number; pdfUrl: string; stripePaymentLink: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setLineItems([{ description: `${typeLabel} — ${serviceLabel} Service`, quantity: 1, unitPrice: 0 }]);
      setVatEnabled(false); setDueDate(defaultDueDate()); setNotes("");
      setPreview(null); setError(""); setFullJobValue(0); setDepositPercent(25);
    } else {
      // If quote total exists, pre-fill it as the full job value
      if (quoteTotal && quoteTotal > 0) {
        setFullJobValue(quoteTotal);
      }
      // Pre-populate additional services as line items
      const extras: LineItem[] = [];
      if (additionalServices?.packing_services) extras.push({ description: "Packing Services", quantity: 1, unitPrice: 0 });
      if (additionalServices?.packing_materials) extras.push({ description: "Packing Materials", quantity: 1, unitPrice: 0 });
      if (additionalServices?.disassemble_furniture) extras.push({ description: "Furniture Disassembly", quantity: 1, unitPrice: 0 });
      if (additionalServices?.assemble_furniture) extras.push({ description: "Furniture Assembly", quantity: 1, unitPrice: 0 });
      if (extras.length > 0) {
        setLineItems([{ description: `${typeLabel} — ${serviceLabel} Service`, quantity: 1, unitPrice: 0 }, ...extras]);
      }
    }
  }, [isOpen, typeLabel, serviceLabel, additionalServices, quoteTotal]);

  // For deposit: auto-calculate deposit amount from full job value + %
  const isDeposit = type === "deposit";
  const depositAmount = isDeposit && fullJobValue > 0 ? Math.round(fullJobValue * (depositPercent / 100) * 100) / 100 : 0;
  const balanceRemaining = isDeposit && fullJobValue > 0 ? Math.round((fullJobValue - depositAmount) * 100) / 100 : 0;

  const subtotal = isDeposit && fullJobValue > 0
    ? depositAmount
    : lineItems.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const vatAmount = vatEnabled ? subtotal * 0.2 : 0;
  const total = subtotal + vatAmount;

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addItem = () => setLineItems(prev => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setLineItems(prev => prev.filter((_, i) => i !== idx));

  const handleGenerate = async () => {
    if (isDeposit && fullJobValue > 0) {
      if (depositPercent <= 0 || depositPercent >= 100) { setError("Deposit percentage must be between 1 and 99%."); return; }
    } else if (!isDeposit) {
      if (lineItems.some(i => !i.description.trim() || i.unitPrice <= 0)) {
        setError("All line items must have a description and a price greater than £0."); return;
      }
    }
    setError(""); setIsGenerating(true);

    // For deposit: build a single line item from the deposit amount
    const submittedLineItems = isDeposit && fullJobValue > 0
      ? [{ description: `Deposit (${depositPercent}%) — ${serviceLabel} Service`, quantity: 1, unitPrice: depositAmount }]
      : lineItems.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice }));

    const res = await fetch("/api/admin/invoices/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId, type, vatRate: vatEnabled ? 20 : 0, dueDate, notes: notes || undefined,
        lineItems: submittedLineItems,
        fullJobValue: isDeposit && fullJobValue > 0 ? fullJobValue : undefined,
        depositPercentage: isDeposit && fullJobValue > 0 ? depositPercent : undefined,
        balanceRemaining: isDeposit && fullJobValue > 0 ? balanceRemaining : undefined,
      }),
    });
    const data = await res.json() as { success: boolean; invoiceId?: string; invoiceNumber?: string; total?: number; pdfUrl?: string; stripePaymentLink?: string; error?: string };
    setIsGenerating(false);
    if (data.success && data.invoiceId) {
      setPreview({ id: data.invoiceId, invoiceNumber: data.invoiceNumber!, total: data.total!, pdfUrl: data.pdfUrl!, stripePaymentLink: data.stripePaymentLink! });
    } else {
      setError(data.error ?? "Failed to generate invoice");
    }
  };

  const handleSend = async () => {
    if (!preview) return;
    setIsSending(true);
    const res = await fetch("/api/admin/invoices/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: preview.id }),
    });
    const data = await res.json() as { success: boolean };
    setIsSending(false);
    if (data.success) {
      toast.success("Invoice sent to customer");
      onSuccess(preview);
      onClose();
    } else {
      toast.error("Failed to send invoice");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate {typeLabel} Invoice</DialogTitle>
          <p className="text-sm text-slate-500">{customerName} — {bookingReference}</p>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-5 py-2">
            {/* Invoice type banner */}
            <div className={`rounded-xl p-3 text-sm ${type === "deposit" ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-purple-50 text-purple-800 border border-purple-200"}`}>
              {type === "deposit"
                ? "This is a deposit invoice. The customer will need to pay this to confirm their booking."
                : "This is the final balance invoice. Send this after the job is complete."}
            </div>

            {/* Quote total banner */}
            {quoteTotal && quoteTotal > 0 && (
              <div className="rounded-xl p-3 text-sm bg-green-50 text-green-800 border border-green-200">
                ✓ Quote found: {formatCurrency(quoteTotal)} — Auto-filled as full job price below.
              </div>
            )}

            {/* Deposit-specific: full job value + deposit % */}
            {isDeposit && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-amber-900">Job Pricing</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-amber-800">Full Job Price (£)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">£</span>
                      <input type="number" min={0} step={0.01} value={fullJobValue || ""} onChange={e => setFullJobValue(Number(e.target.value))}
                        placeholder="0.00" className="h-9 w-full rounded-lg border border-amber-200 bg-white pl-6 pr-2 text-sm outline-none focus:border-amber-400" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-amber-800">Deposit %</label>
                    <div className="relative">
                      <input type="number" min={1} max={99} value={depositPercent} onChange={e => setDepositPercent(Number(e.target.value))}
                        className="h-9 w-full rounded-lg border border-amber-200 bg-white px-3 pr-6 text-sm outline-none focus:border-amber-400" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                    </div>
                  </div>
                </div>
                {fullJobValue > 0 && (
                  <div className="rounded-lg bg-white border border-amber-200 p-3 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500">Full Job Price</span><span className="font-semibold">{formatCurrency(fullJobValue)}</span></div>
                    <div className="flex justify-between text-amber-800"><span>Deposit Due ({depositPercent}%)</span><span className="font-bold">{formatCurrency(depositAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Balance Remaining</span><span className="font-semibold">{formatCurrency(balanceRemaining)}</span></div>
                  </div>
                )}
              </div>
            )}

            {/* Line items — hidden for deposits with full job value set */}
            <div className={isDeposit && fullJobValue > 0 ? "hidden" : ""}>
              <div className="mb-2 grid grid-cols-[1fr_60px_90px_80px_32px] gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <span>Description</span><span className="text-center">Qty</span><span className="text-right">Unit Price</span><span className="text-right">Total</span><span></span>
              </div>
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_60px_90px_80px_32px] items-center gap-2">
                    <input value={item.description} onChange={e => updateItem(idx, "description", e.target.value)}
                      placeholder="Description" className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400" />
                    <input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, "quantity", Number(e.target.value))}
                      className="h-9 rounded-lg border border-slate-200 px-2 text-center text-sm outline-none focus:border-brand-purple-400" />
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-slate-400">£</span>
                      <input type="number" min={0} step={0.01} value={item.unitPrice} onChange={e => updateItem(idx, "unitPrice", Number(e.target.value))}
                        className="h-9 w-full rounded-lg border border-slate-200 pl-6 pr-2 text-right text-sm outline-none focus:border-brand-purple-400" />
                    </div>
                    <span className="text-right text-sm font-medium">{formatCurrency(item.quantity * item.unitPrice)}</span>
                    {lineItems.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addItem} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-sm text-slate-500 hover:border-brand-purple-300 hover:text-brand-purple-600">
                <Plus className="h-4 w-4" /> Add Line Item
              </button>
            </div>

            {/* VAT toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Apply VAT (20%)</p>
                <p className="text-xs text-slate-500">Adds 20% VAT to the subtotal</p>
              </div>
              <button type="button" onClick={() => setVatEnabled(!vatEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${vatEnabled ? "bg-brand-green-600" : "bg-slate-300"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${vatEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {/* Totals preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {vatEnabled && <div className="flex justify-between"><span className="text-slate-500">VAT (20%)</span><span>{formatCurrency(vatAmount)}</span></div>}
                <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                  <span className="font-bold text-brand-purple-800 text-base">Total</span>
                  <span className="font-bold text-brand-purple-800 text-base">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment Due Date</label>
              <input type="date" value={dueDate} min={new Date().toISOString().slice(0, 10)} onChange={e => setDueDate(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400" />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any additional notes to appear on the invoice..."
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-purple-400" />
            </div>

            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleGenerate} disabled={isGenerating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-purple-800 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</> : "Generate & Preview"}
              </button>
            </div>
          </div>
        ) : (
          /* Preview step */
          <div className="space-y-5 py-2">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-green-200 bg-brand-green-50 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-100">
                <FileText className="h-6 w-6 text-brand-green-700" />
              </div>
              <h3 className="font-semibold text-brand-green-900">Invoice Generated Successfully</h3>
              <p className="font-mono text-2xl font-bold text-brand-purple-800">{preview.invoiceNumber}</p>
              <p className="text-sm text-slate-600">Total: <strong>{formatCurrency(preview.total)}</strong></p>
            </div>

            <div className="space-y-2">
              {preview.pdfUrl && (
                <a href={preview.pdfUrl} target="_blank" rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <ExternalLink className="h-4 w-4" /> View PDF
                </a>
              )}
              <button onClick={handleSend} disabled={isSending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-800 py-3 text-sm font-bold text-white disabled:opacity-60">
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isSending ? "Sending…" : "Send to Customer"}
              </button>
              <button onClick={() => { onSuccess(preview); onClose(); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Save as Draft
              </button>
            </div>

            <button onClick={() => setPreview(null)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" /> Edit Invoice
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
