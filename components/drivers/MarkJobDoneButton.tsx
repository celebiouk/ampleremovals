"use client";

import { useState } from "react";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  bookingId: string;
  flatPayAmount: number | null;
  completionMarkedAt: string | null;
  completionConfirmedAt: string | null;
  onMarked: () => void;
}

/**
 * Web equivalent of driver-app's "Mark my job done" button — separate from
 * the Update Job Status section below, which is about the customer side.
 * This is purely "I did my part, pay me" (see
 * app/api/drivers/jobs/[bookingId]/mark-done).
 */
export function MarkJobDoneButton({ bookingId, flatPayAmount, completionMarkedAt, completionConfirmedAt, onMarked }: Props) {
  const [marking, setMarking] = useState(false);

  if (flatPayAmount == null) return null;

  async function markDone() {
    setMarking(true);
    try {
      const res = await fetch(`/api/drivers/jobs/${bookingId}/mark-done`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Marked done", { description: "The office will confirm and release your pay." });
        onMarked();
      } else {
        toast.error(data.error || "Couldn't mark done");
      }
    } catch {
      toast.error("Couldn't mark done");
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {completionConfirmedAt ? (
        <div className="flex items-center gap-2.5 text-brand-green-700">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">Confirmed — ready for payment</span>
        </div>
      ) : completionMarkedAt ? (
        <div className="flex items-center gap-2.5 text-slate-500">
          <Info className="h-5 w-5" />
          <span className="font-semibold">Marked done — waiting for the office to confirm</span>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            Once you&apos;ve finished your part of this job, mark it done so the office can confirm it and release your pay.
          </p>
          <button
            onClick={markDone}
            disabled={marking}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green-600 py-3 font-semibold text-white hover:bg-brand-green-700 disabled:opacity-50"
          >
            {marking ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            Mark my job done — £{flatPayAmount.toFixed(2)}
          </button>
        </>
      )}
    </div>
  );
}
