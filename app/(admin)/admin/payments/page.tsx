"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, CreditCard, PoundSterling, AlertCircle, TrendingUp } from "lucide-react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/admin/AdminSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";

interface PaymentRow {
  id: string; amount: number; payment_method: string | null;
  stripe_payment_intent_id: string | null; paid_at: string;
  invoice_number: string; booking_reference: string;
  customer_name: string; type: string;
}

interface Summary {
  totalAllTime: number; thisMonth: number; outstanding: number; overdue: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [{ data: paymentData }, { data: sentInvoices }, { data: overdueInvoices }] = await Promise.all([
      supabase.from("payments").select("id,amount,payment_method,stripe_payment_intent_id,paid_at,invoices!inner(invoice_number,type,bookings!inner(reference,customers!inner(full_name)))").order("paid_at", { ascending: false }).limit(100),
      supabase.from("invoices").select("total").eq("status", "sent"),
      supabase.from("invoices").select("total").eq("status", "overdue"),
    ]);

    const rows: PaymentRow[] = (paymentData ?? []).map((p: Record<string, unknown>) => {
      const inv = p.invoices as { invoice_number: string; type: string; bookings: { reference: string; customers: { full_name: string } } } | null;
      return {
        id: p.id as string, amount: p.amount as number,
        payment_method: p.payment_method as string | null,
        stripe_payment_intent_id: p.stripe_payment_intent_id as string | null,
        paid_at: p.paid_at as string,
        invoice_number: inv?.invoice_number ?? "—",
        booking_reference: inv?.bookings?.reference ?? "—",
        customer_name: inv?.bookings?.customers?.full_name ?? "—",
        type: inv?.type ?? "—",
      };
    });

    const totalAllTime = rows.reduce((a, r) => a + r.amount, 0);
    const thisMonth = rows.filter(r => r.paid_at >= monthStart).reduce((a, r) => a + r.amount, 0);
    const outstanding = (sentInvoices ?? []).reduce((a: number, i: { total: number }) => a + i.total, 0);
    const overdue = (overdueInvoices ?? []).reduce((a: number, i: { total: number }) => a + i.total, 0);

    setPayments(rows);
    setSummary({ totalAllTime, thisMonth, outstanding, overdue });
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    const csv = Papa.unparse(payments.map(p => ({
      Date: formatDate(p.paid_at),
      Customer: p.customer_name,
      "Booking Ref": p.booking_reference,
      "Invoice #": p.invoice_number,
      Type: p.type,
      Amount: p.amount,
      Method: p.payment_method ?? "—",
      "Stripe ID": p.stripe_payment_intent_id ?? "—",
    })));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "payments.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    { label: "Total Received", value: summary?.totalAllTime ?? 0, icon: PoundSterling, colour: "text-green-700" },
    { label: "This Month", value: summary?.thisMonth ?? 0, icon: TrendingUp, colour: "text-purple-700" },
    { label: "Outstanding", value: summary?.outstanding ?? 0, icon: CreditCard, colour: "text-amber-600" },
    { label: "Overdue", value: summary?.overdue ?? 0, icon: AlertCircle, colour: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Payments</h2>
          <p className="text-sm text-slate-500">All payments received and outstanding balances</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map(c => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{c.label}</p>
              <c.icon className={`h-5 w-5 ${c.colour}`} />
            </div>
            {isLoading ? <Skeleton className="mt-3 h-8 w-28" /> : (
              <p className={`mt-3 font-display text-2xl font-bold ${c.colour}`}>{formatCurrency(c.value)}</p>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Payment History</h3>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-500">No payments recorded yet</p>
            <p className="mt-1 text-sm text-slate-400">Payments will appear here once invoices are paid via Stripe</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Booking</th>
                  <th className="px-4 py-3 text-left">Invoice</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Method</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(p.paid_at)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.customer_name}</td>
                    <td className="px-4 py-3 font-mono text-sm text-purple-700">{p.booking_reference}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-600">{p.invoice_number}</td>
                    <td className="px-4 py-3 text-sm capitalize text-slate-600">{p.type.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-green-700">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-sm capitalize text-slate-500">{p.payment_method ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
