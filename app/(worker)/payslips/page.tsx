'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Payslip {
  id: string;
  pay_run_id: string;
  gross_earnings: number;
  tips_total: number;
  adjustments_total: number;
  net_pay: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  pay_runs: {
    reference: string;
    period_start: string;
    period_end: string;
  };
}

export default function PayslipsPage() {
  const router = useRouter();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ paid: 0, pending: 0, total: 0 });

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        // Determine if user is driver or cleaner
        const { data: driver } = await supabase
          .from('drivers')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        const { data: cleaner } = await supabase
          .from('cleaners')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (!driver && !cleaner) {
          router.push('/');
          return;
        }

        const workerId = driver?.id || cleaner?.id;
        const workerType = driver ? 'driver' : 'cleaner';

        // Fetch payslips
        const { data, error } = await supabase
          .from('payslips')
          .select(
            `
            id,
            gross_earnings,
            tips_total,
            adjustments_total,
            net_pay,
            status,
            paid_at,
            created_at,
            pay_runs(reference, period_start, period_end)
          `
          )
          .eq('worker_type', workerType)
          .eq('worker_id', workerId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPayslips(data || []);

        // Calculate totals
        const paid = data
          ?.filter((p) => p.status === 'paid')
          .reduce((sum, p) => sum + p.net_pay, 0) || 0;
        const pending = data
          ?.filter((p) => p.status === 'pending')
          .reduce((sum, p) => sum + p.net_pay, 0) || 0;

        setTotals({
          paid,
          pending,
          total: paid + pending,
        });
      } catch (e) {
        console.error('Failed to fetch payslips:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslips();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading payslips...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Payslips</h1>
          <Link
            href="/payslips/settings"
            className="text-purple-600 hover:text-purple-700 font-medium text-sm border border-purple-200 rounded-lg px-4 py-2 transition"
          >
            Settings
          </Link>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-slate-600 font-medium">Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(totals.paid)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-slate-600 font-medium">Pending</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {formatCurrency(totals.pending)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <Link
            href="/payslips/earnings-summary"
            className="block bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 text-purple-700 font-medium hover:from-purple-100 hover:to-purple-200 transition border border-purple-200 text-sm"
          >
            📊 Earnings
          </Link>
          <Link
            href="/payslips/payment-history"
            className="block bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 text-green-700 font-medium hover:from-green-100 hover:to-green-200 transition border border-green-200 text-sm"
          >
            ✓ History
          </Link>
          <Link
            href="/payslips/tax-summary"
            className="block bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 text-blue-700 font-medium hover:from-blue-100 hover:to-blue-200 transition border border-blue-200 text-sm"
          >
            💷 Tax
          </Link>
          <Link
            href="/payslips/tax-documents"
            className="block bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 text-orange-700 font-medium hover:from-orange-100 hover:to-orange-200 transition border border-orange-200 text-sm"
          >
            📄 Documents
          </Link>
        </div>

        {/* Payslips List */}
        {payslips.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-slate-600">No payslips yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payslips.map((payslip) => (
              <Link
                key={payslip.id}
                href={`/payslips/${payslip.id}`}
                className="block"
              >
                <div className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {payslip.pay_runs.reference}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {new Date(payslip.pay_runs.period_start).toLocaleDateString(
                          'en-GB'
                        )}{' '}
                        –{' '}
                        {new Date(payslip.pay_runs.period_end).toLocaleDateString(
                          'en-GB'
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(payslip.net_pay)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                          payslip.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {payslip.status === 'paid' ? '✓ Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
