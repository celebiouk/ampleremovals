"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Issue {
  payslip_id: string;
  worker_id: string;
  worker_type: string;
  worker_name?: string;
  net_pay: number;
  problems: string[];
}

interface Reconciliation {
  total_paid_payslips: number;
  total_paid_amount: number;
  issue_count: number;
  issues: Issue[];
}

export default function ReconciliationPage() {
  const [data, setData] = useState<Reconciliation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/payroll/reconciliation");
        const json = await res.json();
        if (json.success) setData(json.reconciliation);
      } catch (e) {
        console.error("Failed to load reconciliation:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/payroll" className="text-slate-600 hover:text-slate-900 font-medium">
        ← Back to payroll
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Payment Reconciliation</h1>
        <p className="mt-1 text-slate-600">
          Internal integrity check of paid payslips. Workers are paid by bank transfer, so this
          flags paid payslips whose linked earnings weren&apos;t fully marked paid, or that are
          missing payment details.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-600">Paid payslips</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{data?.total_paid_payslips ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-600">Total paid</p>
          <p className="mt-2 text-2xl font-bold text-purple-600">
            {formatCurrency(data?.total_paid_amount ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-600">Issues found</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              (data?.issue_count ?? 0) > 0 ? "text-amber-600" : "text-green-600"
            }`}
          >
            {data?.issue_count ?? 0}
          </p>
        </div>
      </div>

      {/* Issues */}
      {(data?.issue_count ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-green-200 bg-green-50 py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
          <p className="mt-3 font-semibold text-green-800">All payments reconciled</p>
          <p className="text-sm text-green-700">Every paid payslip is internally consistent.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.issues.map((issue) => (
            <div
              key={issue.payslip_id}
              className="rounded-lg border border-amber-200 bg-amber-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      {issue.worker_name ?? `${issue.worker_type} ${issue.worker_id.slice(0, 8)}`}
                    </p>
                    <ul className="mt-1 list-disc pl-4 text-sm text-amber-800">
                      {issue.problems.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                  {formatCurrency(issue.net_pay)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
