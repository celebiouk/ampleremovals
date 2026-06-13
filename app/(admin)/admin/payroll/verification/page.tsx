'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface PaymentVerification {
  total_paid: number;
  total_payslips: number;
  payment_methods: Array<{
    method: string;
    count: number;
    total: number;
    avg: number;
  }>;
  recent_payments: Array<{
    id: string;
    worker_type: string;
    net_pay: number;
    payment_method: string;
    paid_at: string;
  }>;
}

export default function PaymentVerificationPage() {
  const [verification, setVerification] = useState<PaymentVerification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const response = await fetch('/api/admin/payslips/verification');
        const data = await response.json();
        if (data.success) {
          setVerification(data.verification);
        }
      } catch (e) {
        console.error('Failed to fetch verification:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading verification data...</p>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Payment Verification</h1>
        <p className="text-slate-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Payment Verification</h1>
        <Link
          href="/admin/payroll"
          className="text-slate-600 hover:text-slate-900 font-medium"
        >
          ← Back
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Total Paid</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(verification.total_paid)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Payslips</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {verification.total_payslips}
          </p>
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Methods</h2>
        <div className="space-y-3">
          {verification.payment_methods.map((method) => (
            <div key={method.method} className="flex items-center justify-between pb-3 border-b last:border-0">
              <div>
                <p className="font-medium text-slate-900 capitalize">
                  {method.method.replace('_', ' ')}
                </p>
                <p className="text-sm text-slate-600">
                  {method.count} payslips
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">
                  {formatCurrency(method.total)}
                </p>
                <p className="text-sm text-slate-600">
                  avg {formatCurrency(method.avg)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Payments ({verification.recent_payments.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-slate-600 font-medium">Date</th>
                <th className="px-4 py-2 text-left text-slate-600 font-medium">Type</th>
                <th className="px-4 py-2 text-left text-slate-600 font-medium">Method</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {verification.recent_payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {new Date(payment.paid_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700">
                    {payment.worker_type}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700">
                    {payment.payment_method?.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {formatCurrency(payment.net_pay)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
