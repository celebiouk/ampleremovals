"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface InvoiceInfo {
  invoice_number: string;
  total: number;
  type: string;
  booking_reference: string;
  service_type: string;
  customer_name: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");
  const [info, setInfo] = useState<InvoiceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) { setIsLoading(false); return; }
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("invoices")
        .select("invoice_number, total, type, bookings!inner(reference, service_type, customers!inner(full_name))")
        .eq("id", invoiceId)
        .single();
      if (data) {
        const rawBookings = data.bookings;
        const booking = (Array.isArray(rawBookings) ? rawBookings[0] : rawBookings) as { reference: string; service_type: string; customers: { full_name: string } | { full_name: string }[] } | null;
        const rawCustomers = booking?.customers;
        const customerName = (Array.isArray(rawCustomers) ? rawCustomers[0]?.full_name : rawCustomers?.full_name) ?? "";
        setInfo({
          invoice_number: data.invoice_number,
          total: data.total,
          type: data.type,
          booking_reference: booking?.reference ?? "",
          service_type: booking?.service_type ?? "",
          customer_name: customerName,
        });
      }
      setIsLoading(false);
    };
    load();
  }, [invoiceId]);

  const isDeposit = info?.type === "deposit";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-purple-50 to-white px-4 py-16">
      <div className="w-full max-w-lg text-center">
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-green-100"
        >
          <motion.svg
            viewBox="0 0 52 52"
            className="h-12 w-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.circle cx="26" cy="26" r="25" fill="none" stroke="#16a34a" strokeWidth="2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
            <motion.path fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5 }} />
          </motion.svg>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h1 className="font-display text-3xl font-extrabold text-brand-purple-950">
            Payment Received — Thank You!
          </h1>
          <p className="mt-3 text-lg text-slate-600">Your payment has been processed successfully.</p>
        </motion.div>

        {!isLoading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="mt-8 rounded-2xl border border-brand-purple-100 bg-white p-6 shadow-sm text-left">
            {info ? (
              <>
                <h2 className="mb-4 font-semibold text-slate-900">Payment Summary</h2>
                <dl className="space-y-2 text-sm">
                  {[
                    ["Invoice", info.invoice_number],
                    ["Amount Paid", formatCurrency(info.total)],
                    ["Booking Reference", info.booking_reference],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="font-semibold text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 leading-relaxed">
                  {isDeposit
                    ? "Your booking is now confirmed. We will be in touch 24 hours before your move date to confirm arrival time."
                    : "Thank you for completing your payment. We hope everything went perfectly. We would love your feedback!"}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 text-center">
                Thank you for your payment. Please keep your booking reference for your records.
              </p>
            )}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-6">
          <Link href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-green-600 px-6 py-3 font-bold text-white shadow-lg shadow-brand-green-600/25 hover:bg-brand-green-500">
            Back to Homepage
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple-700 border-t-transparent" /></div>}><SuccessContent /></Suspense>;
}
