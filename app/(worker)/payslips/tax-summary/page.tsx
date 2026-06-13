'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface TaxSummary {
  year: number;
  ytd_gross: number;
  ytd_tips: number;
  ytd_net: number;
  payslip_count: number;
  estimated_tax: number;
  estimated_ni: number;
  estimated_total_deductions: number;
  tax_threshold: number;
  ni_threshold: number;
}

export default function TaxSummaryPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/worker/tax-summary');
        const data = await response.json();
        if (data.success) {
          setSummary(data.tax_summary);
        }
      } catch (e) {
        console.error('Failed to fetch tax summary:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading tax summary...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="max-w-2xl mx-auto p-6">
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

      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Tax Summary {summary.year}
      </h1>

      {/* YTD Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-8 mb-6 border border-purple-200">
        <p className="text-purple-600 text-sm font-medium">Year to Date Earnings</p>
        <p className="text-4xl font-bold text-purple-900 mt-2">
          {formatCurrency(summary.ytd_gross)}
        </p>
        <p className="text-purple-700 text-sm mt-2">
          {summary.payslip_count} payslips
        </p>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Earnings Breakdown</h2>

        <div className="space-y-4 pb-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Gross Earnings</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(summary.ytd_gross)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Tips</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(summary.ytd_tips)}
            </span>
          </div>
        </div>

        <div className="space-y-4 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Estimated Deductions</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Income Tax (20%)</span>
            <span className="font-semibold text-slate-700">
              {formatCurrency(summary.estimated_tax)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">National Insurance (8%)</span>
            <span className="font-semibold text-slate-700">
              {formatCurrency(summary.estimated_ni)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between py-4">
          <span className="text-lg font-semibold text-slate-900">Estimated Net</span>
          <span className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.ytd_net)}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">ℹ️ Tax Estimates</p>
        <p>
          These estimates are based on 2024/25 tax thresholds (£{summary.tax_threshold.toLocaleString()} for income tax,
          £{summary.ni_threshold.toLocaleString()} for National Insurance). Your actual tax liability may vary based on personal
          circumstances, additional income, or tax relief you may be entitled to. Consult with a tax professional for accurate
          guidance.
        </p>
      </div>
    </div>
  );
}
