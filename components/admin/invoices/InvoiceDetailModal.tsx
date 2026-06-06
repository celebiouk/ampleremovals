"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Skeleton } from "@/components/admin/AdminSkeleton";
import { createClient } from "@/lib/supabase/client";
import type { BookingStatus, InvoiceStatus, InvoiceType, InvoiceLineItem } from "@/types";

interface InvoiceDetail {
  id: string; invoice_number: string; type: InvoiceType; status: InvoiceStatus;
  subtotal: number; vat_rate: number; vat_amount: number; total: number;
  due_date: string | null; sent_at: string | null; paid_at: string | null;
  notes: string | null; stripe_payment_link: string | null; pdf_url: string | null;
  voided_at: string | null; void_reason: string | null;
  line_items: InvoiceLineItem[];
  customer_name: string; customer_email: string; customer_phone: string;
  booking_reference: string; service_type: string; booking_id: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
  onActionComplete: () => void;
}

export function InvoiceDetailModal({ isOpen, onClose, invoiceId, onActionComplete }: Props) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [showPaidConfirm, setShowPaidConfirm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isOpen || !invoiceId) return;
    const load = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("invoices")
        .select("*, bookings!inner(id, reference, service_type, customers!inner(full_name, email, phone))")
        .eq("id", invoiceId)
        .single();
      if (data) {
        const booking = data.bookings as { id: string; reference: string; service_type: string; customers: { full_name: string; email: string; phone: string } } | null;
        setInvoice({
          ...data,
          customer_name: booking?.customers?.full_name ?? "—",
          customer_email: booking?.customers?.email ?? "—",
          customer_phone: booking?.customers?.phone ?? "—",
          booking_reference: booking?.reference ?? "—",
          service_type: booking?.service_type ?? "—",
          booking_id: booking?.id ?? "",
        } as InvoiceDetail);
      }
      setIsLoading(false);
    };
    load();
  }, [isOpen, invoiceId]);

  const handleResend = async () => {
    if (!invoice) return;
    setIsSending(true);
    const res = await fetch("/api/admin/invoices/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId: invoice.id }) });
    const data = await res.json() as { success: boolean };
    setIsSending(false);
    if (data.success) { toast.success("Invoice resent"); onActionComplete(); }
    else toast.error("Failed to resend invoice");
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;
    setIsMarkingPaid(true);
    const res = await fetch(`/api/admin/invoices/${invoice.id}/mark-paid`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentMethod: "bank_transfer" }) });
    const data = await res.json() as { success: boolean };
    setIsMarkingPaid(false);
    setShowPaidConfirm(false);
    if (data.success) { toast.success("Invoice marked as paid"); onActionComplete(); onClose(); }
    else toast.error("Failed to mark as paid");
  };

  const handleVoid = async () => {
    if (!invoice) return;
    setIsVoiding(true);
    const res = await fetch(`/api/admin/invoices/${invoice.id}/void`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const data = await res.json() as { success: boolean };
    setIsVoiding(false);
    setShowVoidConfirm(false);
    if (data.success) { toast.success("Invoice voided"); onActionComplete(); onClose(); }
    else toast.error("Failed to void invoice");
  };

  const copyLink = () => {
    if (invoice?.stripe_payment_link) {
      navigator.clipboard.writeText(invoice.stripe_payment_link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isOverdue = invoice?.status === "sent" && invoice.due_date && new Date(invoice.due_date) < new Date();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  {isLoading ? <Skeleton className="h-6 w-32" /> : <>
                    <span className="font-mono font-bold text-slate-900">{invoice?.invoice_number}</span>
                    {invoice && <StatusBadge status={(isOverdue ? "overdue" : invoice.status) as BookingStatus} />}
                  </>}
                </div>
                <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {isLoading ? (
                  <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : invoice ? (
                  <>
                    {/* Summary */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-medium capitalize">{invoice.type.replace("_", " ")}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-medium">{invoice.customer_name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Booking</span><span className="font-mono font-semibold text-brand-purple-700">{invoice.booking_reference}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold text-brand-purple-800">{formatCurrency(invoice.total)}</span></div>
                      {invoice.due_date && <div className="flex justify-between"><span className="text-slate-500">Due</span><span className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>{formatDate(invoice.due_date)}</span></div>}
                      {invoice.sent_at && <div className="flex justify-between"><span className="text-slate-500">Sent</span><span>{formatDate(invoice.sent_at)}</span></div>}
                      {invoice.paid_at && <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="text-green-700 font-medium">{formatDate(invoice.paid_at)}</span></div>}
                    </div>

                    {/* Line items */}
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Line Items</h4>
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-slate-100 text-xs text-slate-400"><th className="pb-2 text-left">Description</th><th className="pb-2 text-center">Qty</th><th className="pb-2 text-right">Total</th></tr></thead>
                        <tbody>
                          {invoice.line_items.map((item, i) => (
                            <tr key={i} className="border-b border-slate-50">
                              <td className="py-2">{item.description}</td>
                              <td className="py-2 text-center">{item.quantity}</td>
                              <td className="py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
                        {invoice.vat_rate > 0 && <div className="flex justify-between text-slate-500"><span>VAT ({invoice.vat_rate}%)</span><span>{formatCurrency(invoice.vat_amount)}</span></div>}
                        <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-brand-purple-800"><span>Total</span><span>{formatCurrency(invoice.total)}</span></div>
                      </div>
                    </div>

                    {/* Payment link */}
                    {invoice.stripe_payment_link && invoice.status !== "cancelled" && (
                      <div className="rounded-xl border border-slate-200 p-4">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Payment Link</h4>
                        <div className="flex items-center gap-2">
                          <p className="flex-1 truncate text-xs text-brand-purple-700">{invoice.stripe_payment_link}</p>
                          <button onClick={copyLink} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700">
                            {copiedLink ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                          <a href={invoice.stripe_payment_link} target="_blank" rel="noreferrer" className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-brand-purple-700">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {invoice.void_reason && (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                        <p className="font-semibold">This invoice has been voided</p>
                        {invoice.void_reason && <p className="mt-1 text-xs">{invoice.void_reason}</p>}
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Actions bar */}
              {invoice && invoice.status !== "cancelled" && invoice.status !== "paid" && (
                <div className="border-t border-slate-100 p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {(invoice.status === "sent" || isOverdue) && (
                      <button onClick={handleResend} disabled={isSending}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                        {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}Resend
                      </button>
                    )}
                    {invoice.pdf_url && (
                      <a href={invoice.pdf_url} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <ExternalLink className="h-3.5 w-3.5" /> View PDF
                      </a>
                    )}
                    {(invoice.status === "sent" || isOverdue) && (
                      <button onClick={() => setShowPaidConfirm(true)}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-green-600 py-2.5 text-sm font-bold text-white hover:bg-brand-green-500">
                        Mark as Paid
                      </button>
                    )}
                    <button onClick={() => setShowVoidConfirm(true)} className="flex items-center justify-center rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                      Void Invoice
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog isOpen={showPaidConfirm} title="Mark as Paid"
        description="Mark this invoice as paid via bank transfer? This will update the booking status." confirmLabel="Mark Paid" confirmVariant="default"
        onConfirm={handleMarkPaid} onCancel={() => setShowPaidConfirm(false)} />
      <ConfirmDialog isOpen={showVoidConfirm} title="Void Invoice"
        description={`Are you sure you want to void invoice ${invoice?.invoice_number}? This will deactivate the payment link and cannot be undone.`}
        confirmLabel="Void Invoice" confirmVariant="destructive"
        onConfirm={handleVoid} onCancel={() => setShowVoidConfirm(false)} />
    </>
  );
}
