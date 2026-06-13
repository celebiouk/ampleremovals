'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Summary {
  total_payslips: number;
  total_gross: number;
  total_tips: number;
  total_net_paid: number;
  total_net_pending: number;
  average_payslip: number;
  recent_payslips: Array<{ month: string; net_pay: number }>;
}

export default function EarningsSummaryPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/worker/earnings/summary');
        const data = await response.json();

        if (data.success) {
          setSummary(data.summary);
        }
      } catch (e) {
        console.error('Failed to fetch earnings summary:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading earnings summary...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">No data available</p>
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

      <h1 className="text-3xl font-bold text-slate-900 mb-8">Earnings Summary</h1>

      {/* Total earned card */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-8 mb-6 border border-purple-200">
        <p className="text-purple-600 text-sm font-medium">Total Earned</p>
        <p className="text-4xl font-bold text-purple-900 mt-2">
          {formatCurrency(summary.total_net_paid)}
        </p>
        <p className="text-purple-700 text-sm mt-2">
          Across {summary.total_payslips} payslips
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600 text-sm font-medium">Average</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {formatCurrency(summary.average_payslip)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600 text-sm font-medium">Tips Earned</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(summary.total_tips)}
          </p>
        </div>
      </div>

      {/* Pending amount */}
      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200 mb-6">
        <p className="text-yellow-700 text-sm font-medium">Pending Payment</p>
        <p className="text-2xl font-bold text-yellow-800 mt-2">
          {formatCurrency(summary.total_net_pending)}
        </p>
      </div>

      {/* Recent payslips */}
      {summary.recent_payslips.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Payslips</h2>
          <div className="space-y-3">
            {summary.recent_payslips.map((ps, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <span className="text-slate-600">{ps.month}</span>
                <span className="font-semibold text-purple-600">
                  {formatCurrency(ps.net_pay)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
