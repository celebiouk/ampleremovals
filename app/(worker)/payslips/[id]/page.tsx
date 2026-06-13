'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Payslip {
  id: string;
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
  payroll_adjustments: Array<{
    type: string;
    label: string;
    amount: number;
  }>;
}

export default function PayslipDetailPage() {
  const router = useRouter();
  const params = useParams();
  const payslipId = params.id as string;
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayslip = async () => {
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

        // Fetch payslip
        const { data, error: err } = await supabase
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
            pay_runs(reference, period_start, period_end),
            payroll_adjustments(type, label, amount)
          `
          )
          .eq('id', payslipId)
          .eq('worker_type', workerType)
          .eq('worker_id', workerId)
          .single();

        if (err || !data) {
          setError('Payslip not found');
          return;
        }

        setPayslip(data);
      } catch (e) {
        console.error('Failed to fetch payslip:', e);
        setError('Failed to load payslip');
      } finally {
        setLoading(false);
      }
    };

    fetchPayslip();
  }, [payslipId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading payslip...</p>
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">{error || 'Failed to load payslip'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto p-6">
        <Link
          href="/payslips"
          className="text-purple-600 hover:text-purple-700 font-medium mb-6 inline-block"
        >
          ← Back to payslips
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          {payslip.pay_runs.reference}
        </h1>

        {/* Period */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-sm text-slate-600">Period</p>
          <p className="text-lg font-semibold text-slate-900 mt-2">
            {new Date(payslip.pay_runs.period_start).toLocaleDateString('en-GB')} –{' '}
            {new Date(payslip.pay_runs.period_end).toLocaleDateString('en-GB')}
          </p>
        </div>

        {/* Payment breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Payment Breakdown
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Gross Earnings</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(payslip.gross_earnings)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Tips</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(payslip.tips_total)}
              </span>
            </div>
            {payslip.adjustments_total !== 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Adjustments</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(payslip.adjustments_total)}
                </span>
              </div>
            )}
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-900">Net Pay</span>
              <span className="text-2xl font-bold text-purple-600">
                {formatCurrency(payslip.net_pay)}
              </span>
            </div>
          </div>
        </div>

        {/* Adjustments */}
        {payslip.payroll_adjustments && payslip.payroll_adjustments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Adjustments
            </h2>
            <div className="space-y-3">
              {payslip.payroll_adjustments.map((adj, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{adj.label}</p>
                    <p className="text-sm text-slate-600 capitalize">{adj.type}</p>
                  </div>
                  <span
                    className={`font-semibold ${
                      adj.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {adj.amount >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Payment Status
          </h2>
          <div className="flex items-center justify-between">
            <span
              className={`px-4 py-2 rounded-full font-medium ${
                payslip.status === 'paid'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {payslip.status === 'paid' ? '✓ Paid' : 'Pending'}
            </span>
            {payslip.paid_at && (
              <p className="text-sm text-slate-600">
                Paid on{' '}
                {new Date(payslip.paid_at).toLocaleDateString('en-GB')}
              </p>
            )}
          </div>
        </div>

        {/* Download PDF */}
        <a
          href={`/api/worker/payslips/${payslipId}/pdf`}
          download
          className="inline-block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition"
        >
          Download PDF
        </a>
      </div>
    </div>
  );
}
