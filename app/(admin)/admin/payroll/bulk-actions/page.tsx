'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface Payslip {
  id: string;
  worker_id: string;
  worker_type: string;
  status: string;
  gross_earnings: number;
  net_pay: number;
  pay_runs: { reference: string };
}

export default function BulkActionsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'mark_paid' | 'send_notifications' | 'add_adjustment'>('mark_paid');
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'bonus',
    amount: '',
    description: '',
  });
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const response = await fetch(`/api/admin/payslips?status=${statusFilter}`);
        const data = await response.json();
        if (data.success) {
          setPayslips(data.payslips || []);
        }
      } catch (e) {
        console.error('Failed to fetch payslips:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslips();
  }, [statusFilter]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === payslips.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(payslips.map((p) => p.id)));
    }
  };

  const handleBulkAction = async () => {
    if (selected.size === 0) {
      setMessage('Please select at least one payslip');
      return;
    }

    setProcessing(true);
    setMessage('');

    try {
      const body: any = {
        payslip_ids: Array.from(selected),
        action,
      };

      if (action === 'add_adjustment') {
        if (!adjustmentData.amount || !adjustmentData.description) {
          setMessage('Please fill in amount and description');
          setProcessing(false);
          return;
        }
        body.data = {
          type: adjustmentData.type,
          amount: parseInt(adjustmentData.amount) * 100, // Convert to pence
          description: adjustmentData.description,
        };
      }

      const response = await fetch('/api/admin/payslips/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setSelected(new Set());
        // Refetch payslips
        const refreshResponse = await fetch(`/api/admin/payslips?status=${statusFilter}`);
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setPayslips(refreshData.payslips || []);
        }
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (e) {
      setMessage(`❌ Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const selectedTotal = payslips
    .filter((p) => selected.has(p.id))
    .reduce((sum, p) => sum + p.net_pay, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading payslips...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Bulk Actions</h1>
        <Link
          href="/admin/payroll"
          className="text-slate-600 hover:text-slate-900 font-medium"
        >
          ← Back
        </Link>
      </div>

      {/* Status filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-slate-900 mb-3">
          Filter by Status
        </label>
        <div className="flex gap-2">
          {['pending', 'draft', 'paid'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setSelected(new Set());
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === s
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Action selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-slate-900 mb-3">
          Select Action
        </label>
        <div className="space-y-3">
          {[
            { value: 'mark_paid', label: 'Mark Selected as Paid' },
            { value: 'send_notifications', label: 'Send Notifications' },
            { value: 'add_adjustment', label: 'Add Adjustment' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="action"
                value={opt.value}
                checked={action === opt.value}
                onChange={(e) => setAction(e.target.value as any)}
                className="w-4 h-4"
              />
              <span className="text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Adjustment details */}
      {action === 'add_adjustment' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">Adjustment Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Type
              </label>
              <select
                value={adjustmentData.type}
                onChange={(e) =>
                  setAdjustmentData({ ...adjustmentData, type: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="bonus">Bonus</option>
                <option value="deduction">Deduction</option>
                <option value="tax_adjustment">Tax Adjustment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Amount (£)
              </label>
              <input
                type="number"
                value={adjustmentData.amount}
                onChange={(e) =>
                  setAdjustmentData({ ...adjustmentData, amount: e.target.value })
                }
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Description
              </label>
              <input
                type="text"
                value={adjustmentData.description}
                onChange={(e) =>
                  setAdjustmentData({ ...adjustmentData, description: e.target.value })
                }
                placeholder="e.g., Christmas bonus"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Payslips table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Payslips ({payslips.length})
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Selected: {selected.size} • Total: {formatCurrency(selectedTotal)}
              </p>
            </div>
            <button
              onClick={selectAll}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition"
            >
              {selected.size === payslips.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selected.size === payslips.length && payslips.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Worker
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                Net
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payslips.map((payslip) => (
              <tr key={payslip.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selected.has(payslip.id)}
                    onChange={() => toggleSelect(payslip.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {payslip.pay_runs.reference}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {payslip.worker_id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 text-right font-semibold text-slate-900">
                  {formatCurrency(payslip.net_pay)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      payslip.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : payslip.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {payslip.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleBulkAction}
          disabled={selected.size === 0 || processing}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition ${
            selected.size === 0 || processing
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {processing ? 'Processing...' : `Execute Action (${selected.size})`}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.startsWith('✅')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
