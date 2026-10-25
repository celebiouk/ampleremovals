/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { JOB_STATUS_LABELS } from "@/lib/constants";
import type { JobStatusUpdate } from "@/types";
import {
  Navigation,
  Clock,
  Package,
  CheckCircle2,
  MapPin,
  Home,
  Calendar,
  Loader2,
  Users,
  PoundSterling,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { AddExtraChargeButton } from "@/components/drivers/AddExtraChargeButton";
import { MarkJobDoneButton } from "@/components/drivers/MarkJobDoneButton";

export default function DriverJobDetailPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<JobStatusUpdate | null>(null);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState("");
  const [coDrivers, setCoDrivers] = useState<Array<{ name: string; isLead: boolean }>>([]);
  const [earning, setEarning] = useState<any>(null);

  useEffect(() => {
    loadJobDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function loadJobDetails() {
    // Same redacted route the native app uses — role, pay-confirmation state,
    // and customer/address PII gating all come from one place server-side.
    try {
      const res = await fetch(`/api/drivers/jobs/${bookingId}`);
      const data = await res.json();
      if (!data.success || !data.job) {
        toast.error(data.error || "Job not found");
        setLoading(false);
        return;
      }
      setJob(data.job);
    } catch {
      toast.error("Couldn't load this job");
      setLoading(false);
      return;
    }
    setLoading(false);

    // Co-drivers + this job's own earning breakdown.
    try {
      const res = await fetch(`/api/drivers/jobs/${bookingId}/extras`);
      const extras = await res.json();
      if (extras.success) {
        setCoDrivers(extras.coDrivers || []);
        setEarning(extras.earning || null);
      }
    } catch {
      /* non-critical */
    }
  }

  async function handleStatusUpdate(status: JobStatusUpdate) {
    if (status === "job_completed") {
      if (!confirm("Are you sure you want to mark this job as complete? This will notify the customer and office.")) {
        return;
      }
    }

    setUpdating(true);

    try {
      const response = await fetch(`/api/drivers/jobs/${bookingId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note || null }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to update status");
        setUpdating(false);
        return;
      }

      toast.success(`Status updated: ${JOB_STATUS_LABELS[status]}`);
      setCurrentStatus(status);
      setNote("");
      setUpdating(false);
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status");
      setUpdating(false);
    }
  }

  function formatAddress(address: any): string {
    if (!address) return "N/A";
    if (address.postcode_outward && !address.line_1) return address.postcode_outward;
    const parts = [address.line_1, address.line_2, address.city, address.county, address.postcode].filter(Boolean);
    return parts.join(", ");
  }

  function addressPostcode(address: any): string {
    return address?.postcode || address?.postcode_outward || "—";
  }

  function getDirectionsUrl(address: any): string {
    return `https://maps.google.com/?q=${encodeURIComponent(formatAddress(address))}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Job not found</p>
      </div>
    );
  }

  const isPorter = job.role === "porter";

  const statusButtons: Array<{
    status: JobStatusUpdate;
    label: string;
    icon: any;
    color: string;
  }> = [
    { status: "on_my_way", label: "On My Way", icon: Navigation, color: "purple" },
    { status: "twenty_mins_away", label: "20 Minutes Away", icon: Clock, color: "blue" },
    { status: "ten_mins_away", label: "10 Minutes Away", icon: Clock, color: "amber" },
    { status: "fifteen_mins_to_delivery", label: "15 Mins to Delivery", icon: Package, color: "orange" },
    { status: "job_completed", label: "Job Completed ✓", icon: CheckCircle2, color: "green" },
  ];

  const customerName = job.is_anyvan
    ? "AnyVan job"
    : job.customer?.full_name
      ? `${job.customer.full_name.split(" ")[0]} ${job.customer.full_name.split(" ")[1]?.[0] ?? ""}.`.trim()
      : null;

  return (
    <div className="space-y-4 pb-6">
      {/* Job Summary Card */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-purple-600 to-brand-purple-800 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
            {job.service_type?.replace(/_/g, " ")}
          </div>
          {isPorter && (
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">Porter</span>
          )}
        </div>
        <div className="mt-1 text-2xl font-bold">{customerName ?? "Job details locked"}</div>
        <div className="mt-0.5 font-mono text-sm opacity-80">{job.reference}</div>
        {job.move_date && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            {new Date(job.move_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </div>
        )}
      </div>

      {/* Pay confirmation — "I did my part, pay me", separate from the
          customer-facing status updates below */}
      <MarkJobDoneButton
        bookingId={bookingId}
        flatPayAmount={job.flatPayAmount ?? null}
        completionMarkedAt={job.completionMarkedAt ?? null}
        completionConfirmedAt={job.completionConfirmedAt ?? null}
        onMarked={loadJobDetails}
      />

      {/* On-site extra charge */}
      <AddExtraChargeButton bookingId={bookingId} />

      {/* Co-drivers & My Earnings */}
      {(coDrivers.length > 0 || earning) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {coDrivers.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-slate-700">
                <Users className="h-5 w-5" />
                <span className="font-semibold">Working With</span>
              </div>
              <ul className="space-y-2">
                {coDrivers.map((cd, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple-100 text-sm font-semibold text-brand-purple-700">
                      {cd.name[0]}
                    </div>
                    <span>{cd.name}</span>
                    {cd.isLead && (
                      <span className="rounded-full bg-brand-purple-100 px-2 py-0.5 text-xs font-semibold text-brand-purple-700">Lead</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {earning && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-slate-700">
                <PoundSterling className="h-5 w-5" />
                <span className="font-semibold">My Earnings</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">£{Number(earning.total_earnings).toFixed(2)}</div>
              <dl className="mt-2 space-y-1 text-sm text-slate-600">
                <div className="flex justify-between"><dt>Base ({earning.pay_percentage}%)</dt><dd>£{Number(earning.gross_earnings).toFixed(2)}</dd></div>
                <div className="flex justify-between"><dt>Tips</dt><dd>£{Number(earning.tip_amount).toFixed(2)}</dd></div>
                <div className="flex justify-between border-t border-slate-100 pt-1"><dt>Status</dt><dd className="capitalize">{earning.status?.replace(/_/g, " ")}</dd></div>
              </dl>
            </div>
          )}
        </div>
      )}

      {/* Addresses */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-brand-purple-600">
            <MapPin className="h-5 w-5" />
            <span className="font-semibold">PICK UP</span>
          </div>
          <div className="mb-2 text-slate-700">{formatAddress(job.origin)}</div>
          <div className="mb-4 font-mono text-2xl font-bold text-slate-900">{addressPostcode(job.origin)}</div>
          <a href={getDirectionsUrl(job.origin)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-purple-700">
            <Navigation className="h-5 w-5" /> Get Directions
          </a>
        </div>

        {job.destination && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-brand-green-600">
              <Home className="h-5 w-5" />
              <span className="font-semibold">DROP OFF</span>
            </div>
            <div className="mb-2 text-slate-700">{formatAddress(job.destination)}</div>
            <div className="mb-4 font-mono text-2xl font-bold text-slate-900">{addressPostcode(job.destination)}</div>
            <a href={getDirectionsUrl(job.destination)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-green-700">
              <Navigation className="h-5 w-5" /> Get Directions
            </a>
          </div>
        )}
      </div>

      {/* Job Details */}
      {job.description && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-2 font-semibold text-slate-900">Job Details</h3>
          <p className="whitespace-pre-wrap text-slate-700">{job.description}</p>
        </div>
      )}

      {/* Journey / customer-facing status updates — the lead driver's job,
          a porter just rides along, same as the native app. */}
      {isPorter ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2.5">
            <Info className="h-5 w-5 text-slate-400" />
            <p className="text-sm text-slate-500">You&apos;re a porter on this job — the lead driver handles the journey, pickup and delivery updates.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-1 text-lg font-semibold text-slate-900">Update Job Status</h3>
          <p className="mb-4 text-sm text-slate-600">Tap a button to update the customer and office</p>

          {currentStatus && (
            <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <strong>Current status:</strong> {JOB_STATUS_LABELS[currentStatus]}
            </div>
          )}

          <div className="mb-4 space-y-3">
            {statusButtons.map((btn) => {
              const isActive = currentStatus === btn.status;
              return (
                <button
                  key={btn.status}
                  onClick={() => handleStatusUpdate(btn.status)}
                  disabled={updating}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 px-6 py-4 font-semibold transition-all disabled:opacity-50 ${
                    isActive
                      ? `bg-${btn.color}-600 border-${btn.color}-600 text-white`
                      : `bg-${btn.color}-50 border-${btn.color}-200 text-${btn.color}-900 hover:bg-${btn.color}-100`
                  }`}
                >
                  <btn.icon className="h-6 w-6" />
                  {btn.label}
                  {updating && <Loader2 className="ml-auto h-5 w-5 animate-spin" />}
                </button>
              );
            })}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Add a note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. customer not home, called ahead, slight delay"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
              rows={3}
              maxLength={200}
            />
            <div className="mt-1 text-right text-xs text-slate-500">{note.length}/200</div>
          </div>
        </div>
      )}
    </div>
  );
}
