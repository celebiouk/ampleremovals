/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Plus, Truck, X, Loader2, PoundSterling } from "lucide-react";
import { toast } from "sonner";
import { AssignDriverModal } from "./AssignDriverModal";
import Link from "next/link";

interface AssignedDriversProps {
  bookingId: string;
  bookingReference: string;
}

export function AssignedDrivers({ bookingId, bookingReference }: AssignedDriversProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [tipDriverId, setTipDriverId] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState("");
  const [tipNote, setTipNote] = useState("");
  const [savingTip, setSavingTip] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [bookingId]);

  async function loadAssignments() {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/drivers`);
      const data = await response.json();
      if (data.success) {
        setAssignments(data.assignments);
      }
    } catch (error) {
      console.error("Failed to load drivers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecordTip(driverId: string) {
    const amount = parseFloat(tipAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid tip amount");
      return;
    }

    setSavingTip(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/tips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, amount, note: tipNote || null }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Tip of £${amount.toFixed(2)} recorded`);
        setTipDriverId(null);
        setTipAmount("");
        setTipNote("");
      } else {
        toast.error(data.error || "Failed to record tip");
      }
    } catch (error) {
      console.error("Tip error:", error);
      toast.error("Failed to record tip");
    } finally {
      setSavingTip(false);
    }
  }

  async function handleRemove(assignmentId: string) {
    setRemoving(assignmentId);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/drivers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Driver removed");
        loadAssignments();
      } else {
        toast.error("Failed to remove driver");
      }
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Failed to remove driver");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Truck className="h-5 w-5" />
            Assigned Drivers
          </h3>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-purple-700"
          >
            <Plus className="h-4 w-4" />
            Assign
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
            <Truck className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-600">No drivers assigned yet</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 text-sm font-medium text-brand-purple-600 hover:text-brand-purple-700"
            >
              Assign a driver
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-purple-600 font-semibold text-white">
                      {assignment.driver?.first_name?.[0]}{assignment.driver?.last_name?.[0]}
                    </div>
                    <div>
                      <Link
                        href={`/admin/drivers/${assignment.driver_id}`}
                        className="font-medium text-slate-900 hover:text-brand-purple-600"
                      >
                        {assignment.driver?.first_name} {assignment.driver?.last_name}
                      </Link>
                      <p className="text-sm text-slate-600">
                        Pay: {assignment.pay_percentage_override || assignment.driver?.default_pay_percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTipDriverId(tipDriverId === assignment.driver_id ? null : assignment.driver_id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-green-600"
                      title="Record tip"
                    >
                      <PoundSterling className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(assignment.id)}
                      disabled={removing === assignment.id}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600 disabled:opacity-50"
                      title="Remove driver"
                    >
                      {removing === assignment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Inline tip form */}
                {tipDriverId === assignment.driver_id && (
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex-1 min-w-[120px]">
                        <label className="mb-1 block text-xs font-medium text-slate-600">Tip Amount (£)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.50"
                          value={tipAmount}
                          onChange={(e) => setTipAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-purple-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <label className="mb-1 block text-xs font-medium text-slate-600">Note (optional)</label>
                        <input
                          type="text"
                          value={tipNote}
                          onChange={(e) => setTipNote(e.target.value)}
                          placeholder="e.g. Cash tip"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-purple-500 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleRecordTip(assignment.driver_id)}
                        disabled={savingTip}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {savingTip ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Tip"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AssignDriverModal
        bookingId={bookingId}
        bookingReference={bookingReference}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadAssignments}
      />
    </>
  );
}
