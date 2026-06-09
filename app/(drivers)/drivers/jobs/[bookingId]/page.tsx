/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
} from "lucide-react";
import { toast } from "sonner";

export default function DriverJobDetailPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<JobStatusUpdate | null>(null);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    loadJobDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function loadJobDetails() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Get driver ID
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!driver) return;

    // Fetch booking with addresses and customer
    const { data: booking } = await supabase
      .from("bookings")
      .select(
        `
        *,
        customer:customers(*),
        origin_address:addresses!origin_address_id(*),
        destination_address:addresses!destination_address_id(*)
      `
      )
      .eq("id", bookingId)
      .single();

    if (!booking) {
      toast.error("Job not found");
      return;
    }

    // Get latest status update
    const { data: latestStatus } = await supabase
      .from("driver_job_status_updates")
      .select("status, created_at")
      .eq("booking_id", bookingId)
      .eq("driver_id", driver.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    setJob(booking);
    setCurrentStatus(latestStatus?.status || null);
    setLoading(false);
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
    const parts = [
      address.line_1,
      address.line_2,
      address.city,
      address.county,
      address.postcode,
    ].filter(Boolean);
    return parts.join(", ");
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

  const statusButtons: Array<{
    status: JobStatusUpdate;
    label: string;
    icon: any;
    color: string;
  }> = [
    {
      status: "on_my_way",
      label: "On My Way",
      icon: Navigation,
      color: "purple",
    },
    {
      status: "twenty_mins_away",
      label: "20 Minutes Away",
      icon: Clock,
      color: "blue",
    },
    {
      status: "ten_mins_away",
      label: "10 Minutes Away",
      icon: Clock,
      color: "amber",
    },
    {
      status: "fifteen_mins_to_delivery",
      label: "15 Mins to Delivery",
      icon: Package,
      color: "orange",
    },
    {
      status: "job_completed",
      label: "Job Completed ✓",
      icon: CheckCircle2,
      color: "green",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Job Summary Card */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-purple-600 to-brand-purple-700 p-6 text-white shadow-lg">
        <div className="mb-2 text-sm font-medium opacity-90">
          {job.service_type?.replace(/_/g, " ").toUpperCase()}
        </div>
        <div className="mb-1 text-2xl font-bold">
          {job.customer?.full_name?.split(" ")[0]} {job.customer?.full_name?.split(" ")[1]?.[0]}.
        </div>
        <div className="font-mono text-sm opacity-90">{job.reference}</div>
        {job.move_date && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            {new Date(job.move_date).toLocaleDateString("en-GB")}
          </div>
        )}
      </div>

      {/* Addresses */}
      <div className="space-y-4">
        {/* Pick Up */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center gap-2 text-brand-purple-600">
            <MapPin className="h-5 w-5" />
            <span className="font-semibold">PICK UP</span>
          </div>
          <div className="mb-2 text-slate-700">
            {formatAddress(job.origin_address)}
          </div>
          <div className="mb-4 font-mono text-2xl font-bold text-slate-900">
            {job.origin_address?.postcode || "—"}
          </div>
          <a
            href={getDirectionsUrl(job.origin_address)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-purple-700"
          >
            <Navigation className="h-5 w-5" />
            Get Directions
          </a>
        </div>

        {/* Drop Off */}
        {job.destination_address && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex items-center gap-2 text-green-600">
              <Home className="h-5 w-5" />
              <span className="font-semibold">DROP OFF</span>
            </div>
            <div className="mb-2 text-slate-700">
              {formatAddress(job.destination_address)}
            </div>
            <div className="mb-4 font-mono text-2xl font-bold text-slate-900">
              {job.destination_address?.postcode || "—"}
            </div>
            <a
              href={getDirectionsUrl(job.destination_address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700"
            >
              <Navigation className="h-5 w-5" />
              Get Directions
            </a>
          </div>
        )}
      </div>

      {/* Job Details */}
      {job.description && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 font-semibold text-slate-900">Job Details</h3>
          <p className="text-slate-700 whitespace-pre-wrap">{job.description}</p>
        </div>
      )}

      {/* Status Update Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-2 text-lg font-semibold text-slate-900">
          Update Job Status
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          Tap a button to update the customer and office
        </p>

        {currentStatus && (
          <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <strong>Current status:</strong> {JOB_STATUS_LABELS[currentStatus]}
          </div>
        )}

        {/* Status Buttons */}
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

        {/* Optional Note */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Add a note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. customer not home, called ahead, slight delay"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
            rows={3}
            maxLength={200}
          />
          <div className="mt-1 text-right text-xs text-slate-500">
            {note.length}/200
          </div>
        </div>
      </div>
    </div>
  );
}
