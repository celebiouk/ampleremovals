'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface YearEndSummary {
  year: number;
  total_payslips: number;
  total_gross: number;
  total_tips: number;
  total_net: number;
  estimated_tax: number;
  estimated_ni: number;
  total_deductions: number;
  net_after_tax: number;
  worker_breakdown: {
    drivers: { payslips: number; gross: number };
    cleaners: { payslips: number; gross: number };
  };
  top_earning_months: Array<{ month: string; gross: number; net: number }>;
  monthly_distribution: Record<string, { gross: number; net: number; count: number }>;
}

export default function YearEndPage() {
  const [summary, setSummary] = useState<YearEndSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/admin/payroll/year-end');
        const data = await response.json();
        if (data.success) {
          setSummary(data.year_end_summary);
        }
      } catch (e) {
        console.error('Failed to fetch year-end:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading year-end summary...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Year-End Summary</h1>
        <p className="text-slate-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Year-End Summary {summary.year}</h1>
        <Link
          href="/admin/payroll"
          className="text-slate-600 hover:text-slate-900 font-medium"
        >
          ← Back
        </Link>
      </div>

      {/* Hero summary */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-8 text-white">
        <p className="text-purple-200 text-sm font-medium">Total Payroll {summary.year}</p>
        <p className="text-5xl font-bold mt-2">{formatCurrency(summary.total_gross)}</p>
        <p className="text-purple-200 text-sm mt-2">
          {summary.total_payslips} payslips • {formatCurrency(summary.total_net)} net paid
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-600 font-medium">Gross</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(summary.total_gross)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-600 font-medium">Tips</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(summary.total_tips)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-600 font-medium">Tax & NI</p>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            {formatCurrency(summary.total_deductions)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-600 font-medium">Net After Tax</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(summary.net_after_tax)}
          </p>
        </div>
      </div>

      {/* Tax breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Tax Breakdown</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-slate-600">Income Tax (20%)</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(summary.estimated_tax)}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-slate-600">National Insurance (8%)</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(summary.estimated_ni)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-3">
            <span className="font-semibold text-slate-900">Total Deductions</span>
            <span className="text-xl font-bold text-orange-600">
              {formatCurrency(summary.total_deductions)}
            </span>
          </div>
        </div>
      </div>

      {/* Worker breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Worker Type Breakdown</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 font-medium">Drivers</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">
              {summary.worker_breakdown.drivers.payslips}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {formatCurrency(summary.worker_breakdown.drivers.gross)}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 font-medium">Cleaners</p>
            <p className="text-2xl font-bold text-green-900 mt-2">
              {summary.worker_breakdown.cleaners.payslips}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {formatCurrency(summary.worker_breakdown.cleaners.gross)}
            </p>
          </div>
        </div>
      </div>

      {/* Top earning months */}
      {summary.top_earning_months.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Earning Months</h2>
          <div className="space-y-2">
            {summary.top_earning_months.map((month, idx) => (
              <div
                key={month.month}
                className="flex items-center justify-between p-3 bg-slate-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900">#{idx + 1}</span>
                  <span className="text-slate-600">{month.month}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(month.net)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Gross: {formatCurrency(month.gross)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly distribution table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Distribution</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-slate-600 font-medium">Month</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Gross</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Net</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Payslips</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(summary.monthly_distribution)
                .sort(([a], [b]) => {
                  const aDate = new Date(`01 ${a}`);
                  const bDate = new Date(`01 ${b}`);
                  return bDate.getTime() - aDate.getTime();
                })
                .map(([month, data]) => (
                  <tr key={month} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{month}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(data.gross)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {formatCurrency(data.net)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{data.count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
