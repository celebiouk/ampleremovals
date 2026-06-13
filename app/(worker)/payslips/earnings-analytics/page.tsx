'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface EarningsAnalytics {
  year: number;
  ytd_gross: number;
  ytd_tips: number;
  ytd_net: number;
  payslip_count: number;
  paid_count: number;
  pending_count: number;
  average_gross: number;
  average_net: number;
  best_month: { month: string; gross: number } | null;
  worst_month: { month: string; gross: number } | null;
  trend_percentage: number;
  monthly_breakdown: Record<string, { gross: number; net: number; count: number }>;
}

export default function EarningsAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<EarningsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/worker/earnings/analytics');
        const data = await response.json();

        if (data.success) {
          setAnalytics(data.earnings_analytics);
        }
      } catch (e) {
        console.error('Failed to fetch analytics:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading earnings analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-slate-900">Earnings Analytics</h1>
        <p className="text-slate-600 mt-4">No earnings data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link
        href="/payslips"
        className="text-purple-600 hover:text-purple-700 font-medium mb-6 inline-block"
      >
        ← Back to payslips
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Earnings Analytics {analytics.year}</h1>
      <p className="text-slate-600 mb-8">Your earnings overview and insights</p>

      {/* Hero card */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-8 text-white mb-8">
        <p className="text-purple-200 text-sm">Year to Date</p>
        <p className="text-5xl font-bold mt-2">{formatCurrency(analytics.ytd_gross)}</p>
        <p className="text-purple-200 text-sm mt-2">
          {analytics.payslip_count} payslips • {analytics.paid_count} paid
        </p>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-600 font-medium">Avg per Payslip</p>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {formatCurrency(analytics.average_gross)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-600 font-medium">Total Tips</p>
          <p className="text-xl font-bold text-green-600 mt-2">
            {formatCurrency(analytics.ytd_tips)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-600 font-medium">Pending</p>
          <p className="text-xl font-bold text-yellow-600 mt-2">
            {analytics.pending_count}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-600 font-medium">Trend</p>
          <div className="flex items-center gap-2 mt-2">
            {analytics.trend_percentage >= 0 ? (
              <TrendingUp size={20} className="text-green-600" />
            ) : (
              <TrendingDown size={20} className="text-red-600" />
            )}
            <p className={`text-xl font-bold ${analytics.trend_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(analytics.trend_percentage).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Best & worst months */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {analytics.best_month && (
          <div className="bg-green-50 rounded-lg border border-green-200 p-6">
            <p className="text-sm text-green-700 font-medium">Best Month</p>
            <p className="text-2xl font-bold text-green-900 mt-2">{analytics.best_month.month}</p>
            <p className="text-sm text-green-700 mt-1">{formatCurrency(analytics.best_month.gross)}</p>
          </div>
        )}
        {analytics.worst_month && (
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-6">
            <p className="text-sm text-orange-700 font-medium">Lowest Month</p>
            <p className="text-2xl font-bold text-orange-900 mt-2">{analytics.worst_month.month}</p>
            <p className="text-sm text-orange-700 mt-1">{formatCurrency(analytics.worst_month.gross)}</p>
          </div>
        )}
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-slate-600 font-medium">Month</th>
                <th className="px-6 py-3 text-right text-slate-600 font-medium">Gross</th>
                <th className="px-6 py-3 text-right text-slate-600 font-medium">Net</th>
                <th className="px-6 py-3 text-right text-slate-600 font-medium">Payslips</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(analytics.monthly_breakdown)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, data]) => (
                  <tr key={month} className="hover:bg-slate-50">
                    <td className="px-6 py-3">{month}</td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(data.gross)}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-green-600">
                      {formatCurrency(data.net)}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-600">{data.count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
