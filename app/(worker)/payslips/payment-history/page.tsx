'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Payment {
  id: string;
  net_pay: number;
  payment_method: string;
  paid_at: string;
  pay_runs: { reference: string; period_start: string; period_end: string };
}

interface Summary {
  total_paid: number;
  payment_count: number;
  payment_methods: Record<string, number>;
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/worker/payment-history');
        const data = await response.json();

        if (data.success) {
          setPayments(data.payment_history);
          setSummary(data.summary);
        }
      } catch (e) {
        console.error('Failed to fetch payment history:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading payment history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link
        href="/payslips"
        className="text-purple-600 hover:text-purple-700 font-medium mb-6 inline-block"
      >
        ← Back to payslips
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-8">Payment History</h1>

      {/* Summary card */}
      {summary && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-8 mb-8 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">✓</span>
            <p className="text-green-600 text-sm font-medium">Total Received</p>
          </div>
          <p className="text-4xl font-bold text-green-900 mt-2">
            {formatCurrency(summary.total_paid)}
          </p>
          <p className="text-green-700 text-sm mt-2">
            {summary.payment_count} payment{summary.payment_count !== 1 ? 's' : ''} received
          </p>
        </div>
      )}

      {/* Payments table */}
      {payments.length === 0 ? (
        <div className="bg-slate-50 rounded-lg p-12 text-center">
          <p className="text-slate-600">No payments yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Payslip
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Method
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {payment.pay_runs.reference}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(payment.pay_runs.period_start).toLocaleDateString(
                      'en-GB'
                    )}{' '}
                    –{' '}
                    {new Date(payment.pay_runs.period_end).toLocaleDateString(
                      'en-GB'
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-green-600">
                    {formatCurrency(payment.net_pay)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(payment.paid_at).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium capitalize">
                      {payment.payment_method?.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
