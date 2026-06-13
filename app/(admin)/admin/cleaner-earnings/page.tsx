'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface CleanerEarning {
  id: string;
  cleaner_id: string;
  booking_id: string;
  gross_earnings: number;
  tip_amount: number;
  status: string;
  created_at: string;
  cleaners: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  bookings: {
    reference: string;
    service_type: string;
  };
}

export default function CleanerEarningsPage() {
  const [earnings, setEarnings] = useState<CleanerEarning[]>([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ count: 0, gross: 0, tips: 0 });

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await fetch(
          `/api/admin/cleaner-earnings?status=${status}`
        );
        const data = await response.json();

        if (data.success) {
          setEarnings(data.earnings);
          const gross = data.earnings.reduce(
            (sum: number, e: CleanerEarning) => sum + e.gross_earnings,
            0
          );
          const tips = data.earnings.reduce(
            (sum: number, e: CleanerEarning) => sum + e.tip_amount,
            0
          );
          setTotals({
            count: data.count,
            gross,
            tips,
          });
        }
      } catch (e) {
        console.error('Failed to fetch cleaner earnings:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Cleaner Earnings</h1>
        <Link
          href="/admin"
          className="text-slate-600 hover:text-slate-900 font-medium"
        >
          ← Back
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {['pending', 'approved', 'paid'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              status === s
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Count</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totals.count}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Gross</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {formatCurrency(totals.gross)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-600 font-medium">Tips</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(totals.tips)}
          </p>
        </div>
      </div>

      {/* Earnings table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading...</p>
        </div>
      ) : earnings.length === 0 ? (
        <div className="bg-slate-50 rounded-lg p-12 text-center">
          <p className="text-slate-600">No {status} cleaner earnings</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Cleaner
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Booking
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Gross
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Tips
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {earnings.map((earning) => (
                <tr key={earning.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      {earning.cleaners.first_name} {earning.cleaners.last_name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {earning.cleaners.phone}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      {earning.bookings.reference}
                    </p>
                    <p className="text-sm text-slate-600">
                      {earning.bookings.service_type}
                    </p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {formatCurrency(earning.gross_earnings)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-green-600">
                    {earning.tip_amount > 0
                      ? formatCurrency(earning.tip_amount)
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(earning.created_at).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
