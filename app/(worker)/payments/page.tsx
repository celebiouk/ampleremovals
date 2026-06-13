'use client';

import Link from 'next/link';

export default function PaymentsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Payments</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/payments/confirmations"
          className="block bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-green-900 mb-2">Payment Confirmations</h2>
          <p className="text-green-700">View confirmation details and bank information for all payments received</p>
        </Link>

        <Link
          href="/payslips"
          className="block bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-purple-900 mb-2">Payslips</h2>
          <p className="text-purple-700">View detailed payslips, earnings history, and tax information</p>
        </Link>
      </div>
    </div>
  );
}
