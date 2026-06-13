'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface ComplianceStats {
  total_workers: number;
  total_gross: number;
  total_estimated_tax: number;
  total_estimated_ni: number;
  status_breakdown: {
    ok: number;
    warning: number;
    alert: number;
  };
  high_earners: Array<{
    worker_id: string;
    worker_name?: string;
    total_gross: number;
    estimated_tax: number;
  }>;
}

export default function CompliancePage() {
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        const response = await fetch('/api/admin/payroll/compliance');
        const data = await response.json();
        if (data.success) {
          setStats(data.compliance.stats);
          setWorkers(data.compliance.worker_breakdown);
        }
      } catch (e) {
        console.error('Failed to fetch compliance:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchCompliance();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading compliance data...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Compliance</h1>
        <p className="text-slate-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Tax & Compliance</h1>
        <Link
          href="/admin/payroll"
          className="text-slate-600 hover:text-slate-900 font-medium"
        >
          ← Back
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Workers</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {stats.total_workers}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Est. Tax</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {formatCurrency(stats.total_estimated_tax)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Est. NI</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {formatCurrency(stats.total_estimated_ni)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Total Deductions</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {formatCurrency(stats.total_estimated_tax + stats.total_estimated_ni)}
          </p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Compliance Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <p className="text-sm text-green-700 font-medium">Good Standing</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {stats.status_breakdown.ok}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Warning</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">
                {stats.status_breakdown.warning}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="text-sm text-red-700 font-medium">Alert</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {stats.status_breakdown.alert}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* High earners */}
      {stats.high_earners.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-4">
            High Earners (£100k+) — {stats.high_earners.length}
          </h2>
          <div className="space-y-2">
            {stats.high_earners.map((worker) => (
              <div
                key={worker.worker_id}
                className="flex items-center justify-between p-3 bg-white rounded"
              >
                <span className="font-medium text-slate-900">{worker.worker_name ?? worker.worker_id}</span>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(worker.total_gross)}
                  </p>
                  <p className="text-sm text-slate-600">
                    Tax: {formatCurrency(worker.estimated_tax)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All workers compliance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Worker Compliance Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-slate-600 font-medium">Worker</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Gross</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">Tax (est.)</th>
                <th className="px-4 py-2 text-right text-slate-600 font-medium">NI (est.)</th>
                <th className="px-4 py-2 text-left text-slate-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {workers.map((worker) => (
                <tr key={worker.worker_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {worker.worker_name ?? worker.worker_id}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {formatCurrency(worker.total_gross)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {formatCurrency(worker.estimated_tax)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {formatCurrency(worker.estimated_ni)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        worker.compliance_status === 'ok'
                          ? 'bg-green-100 text-green-700'
                          : worker.compliance_status === 'warning'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {worker.compliance_status}
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
