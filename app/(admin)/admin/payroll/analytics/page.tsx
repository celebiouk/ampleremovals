'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface Analytics {
  total_payslips: number;
  total_gross: number;
  total_tips: number;
  total_net_paid: number;
  total_net_pending: number;
  total_pay_runs: number;
  draft_runs: number;
  finalised_runs: number;
  paid_runs: number;
  drivers: number;
  cleaners: number;
  average_payslip: number;
  year: number;
}

export default function PayrollAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [monthly, setMonthly] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/payroll/analytics');
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
          setMonthly(data.monthly_breakdown);
        }
      } catch (e) {
        console.error('Failed to fetch analytics:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Payroll Analytics</h1>
        <p className="text-slate-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Payroll Analytics {analytics.year}</h1>
        <Link
          href="/admin/payroll"
          className="text-slate-600 hover:text-slate-900 font-medium"
        >
          ← Back
        </Link>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Total Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(analytics.total_net_paid)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {analytics.total_payslips} payslips
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">
            {formatCurrency(analytics.total_net_pending)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Tips</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(analytics.total_tips)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Pay Runs</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {analytics.total_pay_runs}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Workers</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {analytics.drivers + analytics.cleaners}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {analytics.drivers} drivers, {analytics.cleaners} cleaners
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Avg Payslip</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(analytics.average_payslip)}
          </p>
        </div>
      </div>

      {/* Pay runs status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Pay Run Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600">Draft</p>
            <p className="text-3xl font-bold text-slate-400 mt-2">
              {analytics.draft_runs}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Finalised</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {analytics.finalised_runs}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Paid</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {analytics.paid_runs}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-slate-600 font-medium">Month</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Gross</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Net</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(monthly)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, data]) => (
                  <tr key={month} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{month}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(data.gross)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {formatCurrency(data.net)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {data.count}
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
