"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Download, FileText, AlertCircle, PoundSterling, TrendingUp } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Skeleton } from "@/components/admin/AdminSkeleton";
import { InvoiceDetailModal } from "@/components/admin/invoices/InvoiceDetailModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { BookingStatus, InvoiceStatus, InvoiceType } from "@/types";

interface InvoiceRow {
  id: string; invoice_number: string; type: InvoiceType; status: InvoiceStatus;
  total: number; subtotal: number; vat_amount: number; due_date: string | null;
  sent_at: string | null; paid_at: string | null; created_at: string;
  customer_name: string; customer_email: string; booking_reference: string;
  service_type: string; booking_id: string;
}

interface Summary { totalInvoiced: number; totalReceived: number; outstanding: number; overdueCount: number }

const STATUS_OPTIONS: { value: InvoiceStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

function InvoicesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const search = sp.get("search") ?? "";
  const statusFilter = (sp.get("status") ?? "") as InvoiceStatus | "";
  const typeFilter = (sp.get("type") ?? "") as InvoiceType | "";

  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);

  const push = useCallback((params: Record<string, string>) => {
    const p = new URLSearchParams(sp.toString());
    Object.entries(params).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    router.push(`${pathname}?${p.toString()}`);
  }, [router, pathname, sp]);

  const load = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);

    // Auto-update overdue invoices
    await supabase.from("invoices").update({ status: "overdue" }).eq("status", "sent").lt("due_date", today);

    let q = supabase
      .from("invoices")
      .select("id,invoice_number,type,status,total,subtotal,vat_amount,due_date,sent_at,paid_at,created_at,booking_id,bookings!inner(reference,service_type,customers!inner(full_name,email))")
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter) q = q.eq("status", statusFilter);
    if (typeFilter) q = q.eq("type", typeFilter);

    const { data } = await q;
    let rows: InvoiceRow[] = (data ?? []).map((i: Record<string, unknown>) => {
      const b = i.bookings as { reference: string; service_type: string; customers: { full_name: string; email: string } } | null;
      return {
        id: i.id as string, invoice_number: i.invoice_number as string,
        type: i.type as InvoiceType, status: i.status as InvoiceStatus,
        total: i.total as number, subtotal: i.subtotal as number, vat_amount: i.vat_amount as number,
        due_date: i.due_date as string | null, sent_at: i.sent_at as string | null,
        paid_at: i.paid_at as string | null, created_at: i.created_at as string,
        booking_id: i.booking_id as string,
        customer_name: b?.customers?.full_name ?? "—", customer_email: b?.customers?.email ?? "—",
        booking_reference: b?.reference ?? "—", service_type: b?.service_type ?? "—",
      };
    });

    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(i =>
        i.invoice_number.toLowerCase().includes(s) ||
        i.customer_name.toLowerCase().includes(s) ||
        i.booking_reference.toLowerCase().includes(s)
      );
    }

    setInvoices(rows);
    setSummary({
      totalInvoiced: rows.reduce((a, i) => a + i.total, 0),
      totalReceived: rows.filter(i => i.status === "paid").reduce((a, i) => a + i.total, 0),
      outstanding: rows.filter(i => ["sent", "overdue"].includes(i.status)).reduce((a, i) => a + i.total, 0),
      overdueCount: rows.filter(i => i.status === "overdue").length,
    });
    setIsLoading(false);
  }, [search, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (invoiceId: string) => {
    setSendingId(invoiceId);
    const res = await fetch("/api/admin/invoices/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId }) });
    const data = await res.json() as { success: boolean };
    setSendingId(null);
    if (data.success) { toast.success("Invoice sent"); load(); }
    else toast.error("Failed to send invoice");
  };

  const handleMarkPaid = async () => {
    if (!markPaidId) return;
    const res = await fetch(`/api/admin/invoices/${markPaidId}/mark-paid`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentMethod: "bank_transfer" }) });
    const data = await res.json() as { success: boolean };
    setMarkPaidId(null);
    if (data.success) { toast.success("Invoice marked as paid"); load(); }
    else toast.error("Failed to mark as paid");
  };

  const exportCSV = () => {
    const csv = Papa.unparse(invoices.map(i => ({
      "Invoice #": i.invoice_number, Customer: i.customer_name, Email: i.customer_email,
      "Booking Ref": i.booking_reference, Service: i.service_type,
      Type: i.type.replace("_", " "), Subtotal: i.subtotal, VAT: i.vat_amount, Total: i.total,
      Status: i.status, "Due Date": i.due_date ? formatDate(i.due_date) : "",
      "Sent Date": i.sent_at ? formatDate(i.sent_at) : "",
      "Paid Date": i.paid_at ? formatDate(i.paid_at) : "",
    })));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "invoices.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = search || statusFilter || typeFilter;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Invoices</h2>
          <p className="text-sm text-slate-500">{invoices.length} invoices</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />) : [
          { label: "Total Invoiced", value: formatCurrency(summary?.totalInvoiced ?? 0), icon: PoundSterling, colour: "text-purple-700" },
          { label: "Total Received", value: formatCurrency(summary?.totalReceived ?? 0), icon: TrendingUp, colour: "text-green-700" },
          { label: "Outstanding", value: formatCurrency(summary?.outstanding ?? 0), icon: FileText, colour: "text-amber-600" },
          { label: "Overdue", value: `${summary?.overdueCount ?? 0} invoice${(summary?.overdueCount ?? 0) !== 1 ? "s" : ""}`, icon: AlertCircle, colour: "text-red-600" },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-sm text-slate-500">{c.label}</p><c.icon className={`h-5 w-5 ${c.colour}`} /></div>
            <p className={`mt-2 font-display text-2xl font-bold ${c.colour}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input defaultValue={search} onChange={e => { const v = e.target.value; setTimeout(() => push({ search: v }), 300); }}
            placeholder="Invoice #, customer, booking ref…"
            className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-brand-purple-400" />
        </div>
        <select value={statusFilter} onChange={e => push({ status: e.target.value })}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400">
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => push({ type: e.target.value })}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400">
          <option value="">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="full_balance">Full Balance</option>
        </select>
        {hasFilters && (
          <button onClick={() => push({ search: "", status: "", type: "" })}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div> :
        invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-500">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 text-left">Invoice #</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Booking</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Due</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const isOverdue = inv.status === "overdue";
                  return (
                    <tr key={inv.id} className={`border-b border-slate-50 ${isOverdue ? "bg-red-50" : "hover:bg-slate-50"}`}>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-brand-purple-700">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{inv.customer_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{inv.booking_reference}</td>
                      <td className="px-4 py-3 text-sm capitalize text-slate-600">{inv.type.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">{formatCurrency(inv.total)}</td>
                      <td className="px-4 py-3"><StatusBadge status={(isOverdue ? "overdue" : inv.status) as BookingStatus} /></td>
                      <td className="px-4 py-3 text-sm text-slate-500">{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setViewingId(inv.id)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50">View</button>
                          {inv.status === "draft" && (
                            <button onClick={() => handleSend(inv.id)} disabled={sendingId === inv.id}
                              className="rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-xs text-purple-700 hover:bg-purple-100 disabled:opacity-50">
                              {sendingId === inv.id ? "Sending…" : "Send"}
                            </button>
                          )}
                          {(inv.status === "sent" || isOverdue) && (
                            <button onClick={() => setMarkPaidId(inv.id)}
                              className="rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100">
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvoiceDetailModal isOpen={!!viewingId} onClose={() => setViewingId(null)} invoiceId={viewingId} onActionComplete={load} />
      <ConfirmDialog isOpen={!!markPaidId} title="Mark as Paid"
        description="Mark this invoice as paid via bank transfer?" confirmLabel="Mark Paid" confirmVariant="default"
        onConfirm={handleMarkPaid} onCancel={() => setMarkPaidId(null)} />
    </div>
  );
}

export default function AdminInvoicesPage() {
  return <Suspense fallback={<div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>}><InvoicesContent /></Suspense>;
}
