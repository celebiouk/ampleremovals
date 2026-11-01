"use client";

import { DepositsToConfirm } from "@/components/admin/DepositsToConfirm";

export default function DepositsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Deposits to Confirm</h2>
        <p className="text-sm text-slate-500">Check your bank, then confirm to lock in the job.</p>
      </div>
      <DepositsToConfirm showEmptyState />
    </div>
  );
}
