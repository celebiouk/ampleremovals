'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface WorkerReport {
  payslip_count: number;
  paid_count: number;
  pending_count: number;
  total_gross: number;
  total_tips: number;
  total_net: number;
  average_payslip: number;
  estimated_tax: number;
  estimated_ni: number;
  estimated_total_deductions: number;
  monthly_breakdown: Record<string, { gross: number; net: number; count: number }>;
  payslips: Array<{
    id: string;
    gross_earnings: number;
    tips_total: number;
    net_pay: number;
    status: string;
    created_at: string;
    pay_runs: { reference: string };
  }>;
}

export default function WorkerReportPage() {
  const params = useParams();
  const workerId = params.id as string;
  const [report, setReport] = useState<WorkerReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(
          `/api/admin/payroll/workers/${workerId}/report`
        );
        const data = await response.json();
        if (data.success && data.report) {
          setReport(data.report);
        }
      } catch (e) {
        console.error('Failed to fetch worker report:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [workerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading worker report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/payroll"
          className="text-slate-600 hover:text-slate-900 font-medium"
        >
          ← Back
        </Link>
        <p className="text-slate-600">No data found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/payroll"
        className="text-slate-600 hover:text-slate-900 font-medium"
      >
        ← Back to payroll
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Worker Earnings Report</h1>
        <button
          onClick={() =>
            window.open(`/api/admin/payroll/workers/${workerId}/p45`, "_blank", "noopener,noreferrer")
          }
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          Download year-end PDF
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-600 font-medium">Payslips</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {report.payslip_count}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {report.paid_count} paid, {report.pending_count} pending
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-600 font-medium">Total Gross</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(report.total_gross)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-600 font-medium">Tips</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(report.total_tips)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-600 font-medium">Total Net</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(report.total_net)}
          </p>
        </div>
      </div>

      {/* Compliance info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Tax & Compliance</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-blue-700">Income Tax (est.)</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">
              {formatCurrency(report.estimated_tax)}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700">National Insurance (est.)</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">
              {formatCurrency(report.estimated_ni)}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Total Deductions</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">
              {formatCurrency(report.estimated_total_deductions)}
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
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Payslips</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(report.monthly_breakdown)
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

      {/* Payslips list */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Payslips ({report.payslips.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-slate-600 font-medium">Reference</th>
                <th className="px-4 py-2 text-left text-slate-600 font-medium">Date</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Gross</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Tips</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Net</th>
                <th className="px-4 py-2 text-left text-slate-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.payslips.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {p.pay_runs.reference}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(p.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-900">
                    {formatCurrency(p.gross_earnings)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {p.tips_total > 0 ? formatCurrency(p.tips_total) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatCurrency(p.net_pay)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {p.status}
                    </span>
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
