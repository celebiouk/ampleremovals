'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Banknote } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface PaymentConfirmation {
  id: string;
  reference: string;
  period_start: string;
  period_end: string;
  amount: number;
  payment_method: string;
  paid_date: string;
  confirmation_status: string;
  last_four_digits: string;
  sort_code: string;
}

interface PaymentConfirmations {
  total_payments: number;
  total_paid: number;
  pending_payments: number;
  bank_details_on_file: boolean;
  confirmations: PaymentConfirmation[];
}

export default function PaymentConfirmationsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaymentConfirmations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfirmations = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/worker/payments/confirmations');
        const result = await response.json();

        if (result.success) {
          setData(result.payment_confirmations);
        }
      } catch (e) {
        console.error('Failed to fetch confirmations:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmations();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading payment confirmations...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-slate-900">Payment Confirmations</h1>
        <p className="text-slate-600 mt-4">No payment data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        href="/payments"
        className="text-purple-600 hover:text-purple-700 font-medium mb-6 inline-block"
      >
        ← Back to payments
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Confirmations</h1>
      <p className="text-slate-600 mb-8">
        View confirmation details for all payments received
      </p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Total Payments</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {data.total_payments}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Total Received</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(data.total_paid)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Bank Details</p>
          <p className="text-lg font-bold mt-2">
            {data.bank_details_on_file ? (
              <span className="text-green-600">On File</span>
            ) : (
              <span className="text-yellow-600">Not Set</span>
            )}
          </p>
        </div>
      </div>

      {/* Bank details preview */}
      {data.bank_details_on_file && data.confirmations[0] && (
        <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <Banknote size={24} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-blue-900">Bank Account on File</h2>
          </div>
          <div className="space-y-2">
            <p className="text-blue-800">
              <span className="font-medium">Account:</span> ••••{data.confirmations[0].last_four_digits}
            </p>
            {data.confirmations[0].sort_code && (
              <p className="text-blue-800">
                <span className="font-medium">Sort Code:</span> {data.confirmations[0].sort_code}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Payments list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Payment History ({data.total_payments})
          </h2>
        </div>

        <div className="divide-y divide-slate-200">
          {data.confirmations.map((payment) => (
            <div key={payment.id} className="p-6 hover:bg-slate-50 transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-900">{payment.reference}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Period: {new Date(payment.period_start).toLocaleDateString('en-GB')} –{' '}
                    {new Date(payment.period_end).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(payment.amount)}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-green-600">
                    <CheckCircle2 size={16} />
                    <span className="text-sm font-medium">Confirmed</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-600 uppercase font-medium">Date Paid</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {new Date(payment.paid_date).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase font-medium">Method</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 capitalize">
                    {payment.payment_method.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase font-medium">Status</p>
                  <p className="text-sm font-semibold text-green-600 mt-1">Received</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="mt-8 bg-slate-100 rounded-lg p-4 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Need help?</span> If you don't see a payment you're expecting,
          please contact us. Payments typically appear within 1-2 business days.
        </p>
      </div>
    </div>
  );
}
