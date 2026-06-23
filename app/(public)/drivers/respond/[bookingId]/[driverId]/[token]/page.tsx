"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Truck, Check, X, MapPin, Calendar, User, CheckCircle2, XCircle } from "lucide-react";

interface Job { reference: string; service: string; date: string; customer: string; pickup: string; dropoff: string | null }

export default function DriverRespondPage() {
  const params = useParams<{ bookingId: string; driverId: string; token: string }>();
  const { bookingId, driverId, token } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/drivers/respond?bookingId=${bookingId}&driverId=${driverId}&token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) { setJob(d.job); setStatus(d.status); }
        else setError(d.error || "Couldn't load this job.");
      })
      .catch(() => setError("Something went wrong."))
      .finally(() => setLoading(false));
  }, [bookingId, driverId, token]);

  async function respond(action: "accept" | "decline") {
    setSubmitting(action);
    try {
      const res = await fetch("/api/drivers/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, driverId, token, action }),
      });
      const d = await res.json();
      if (d.success) setStatus(d.status);
      else setError(d.error || "Couldn't save your response.");
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple-600"><Truck className="h-7 w-7 text-white" /></div>
          <h1 className="mt-3 text-2xl font-bold text-white">Job Assignment</h1>
          <p className="text-sm text-slate-400">Ample Removals</p>
        </div>

        <div className="rounded-2xl bg-slate-900 p-6">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-brand-purple-400" /></div>
          ) : error ? (
            <p className="py-6 text-center text-slate-300">{error}</p>
          ) : job ? (
            <>
              <div className="space-y-3">
                <Row icon={<Calendar className="h-4 w-4" />} label="Date" value={job.date} />
                <Row icon={<Truck className="h-4 w-4" />} label="Service" value={job.service} />
                <Row icon={<User className="h-4 w-4" />} label="Customer" value={job.customer} />
                <Row icon={<MapPin className="h-4 w-4" />} label="Pickup" value={job.pickup} />
                {job.dropoff && <Row icon={<MapPin className="h-4 w-4" />} label="Delivery" value={job.dropoff} />}
                <p className="pt-1 text-center font-mono text-xs text-slate-500">{job.reference}</p>
              </div>

              <div className="mt-6">
                {status === "accepted" ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-green-600/15 py-4 text-green-400"><CheckCircle2 className="h-5 w-5" /> You accepted this job</div>
                ) : status === "declined" ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-red-600/15 py-4 text-red-400"><XCircle className="h-5 w-5" /> You declined this job</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => respond("accept")} disabled={!!submitting}
                      className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                      {submitting === "accept" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} Accept
                    </button>
                    <button onClick={() => respond("decline")} disabled={!!submitting}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-600 py-3.5 font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60">
                      {submitting === "decline" ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />} Decline
                    </button>
                  </div>
                )}
                {status === "pending" && <p className="mt-3 text-center text-xs text-slate-500">Tap Accept to confirm you&apos;ll take this job. Open the Ample Driver app for full details and navigation.</p>}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-brand-purple-400">{icon}</span>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}
