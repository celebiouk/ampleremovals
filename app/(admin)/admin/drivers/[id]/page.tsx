/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, PoundSterling, Truck, Edit, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DRIVER_STATUS_LABELS } from "@/lib/constants";
import { DriverDocuments } from "@/components/admin/drivers/DriverDocuments";

export default function DriverProfilePage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadDriver();
  }, [driverId]);

  async function loadDriver() {
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}`);
      const data = await response.json();

      if (data.success) {
        setDriver(data.driver);
      }
    } catch (error) {
      console.error("Failed to load driver:", error);
    } finally {
      setLoading(false);
    }
  }

  async function quickApprove() {
    setApproving(true);
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "active",
          default_pay_percentage: 40, // Default 40%
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Driver approved! Status set to Active with 40% pay.");
        router.push("/admin/drivers");
      } else {
        toast.error("Failed to approve driver");
      }
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve driver");
    } finally {
      setApproving(false);
    }
  }

  const isPending = driver && driver.status === "inactive" && driver.default_pay_percentage === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Driver not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/drivers"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {driver.first_name} {driver.last_name}
            </h1>
            <p className="text-slate-600">Driver Profile</p>
          </div>
        </div>
        <Link
          href={`/admin/drivers/${driverId}/edit`}
          className="flex items-center gap-2 rounded-xl bg-brand-purple-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-purple-700"
        >
          <Edit className="h-5 w-5" />
          Edit Profile
        </Link>
      </div>

      {/* Pending Approval Banner */}
      {isPending && (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-bold text-amber-900">
                Pending Approval
              </h3>
              <p className="mb-4 text-sm text-amber-700">
                This driver has submitted their application and is waiting for approval.
                Click below to approve with default settings, or edit manually.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={quickApprove}
                  disabled={approving}
                  className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {approving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Quick Approve (40% Pay, Active)
                    </>
                  )}
                </button>
                <Link
                  href={`/admin/drivers/${driverId}/edit`}
                  className="rounded-xl border-2 border-amber-600 px-4 py-2.5 font-semibold text-amber-700 hover:bg-amber-100"
                >
                  Manual Approval (Custom Settings)
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Driver Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-purple-100 text-2xl font-bold text-brand-purple-700">
                {driver.first_name?.[0]}{driver.last_name?.[0]}
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    {driver.first_name} {driver.last_name}
                  </h2>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      driver.status === "active"
                        ? "bg-green-100 text-green-700"
                        : driver.status === "suspended"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {DRIVER_STATUS_LABELS[driver.status as keyof typeof DRIVER_STATUS_LABELS]}
                  </span>
                </div>
                {driver.preferred_name && (
                  <p className="mb-2 text-slate-600">
                    Prefers: <span className="font-medium">{driver.preferred_name}</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {driver.email}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {driver.phone}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Hired {new Date(driver.hire_date).toLocaleDateString("en-GB")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900">Personal Details</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-600">Date of Birth</dt>
                <dd className="mt-1 text-slate-900">
                  {new Date(driver.date_of_birth).toLocaleDateString("en-GB")}
                </dd>
              </div>
              {driver.emergency_contact_name && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-slate-600">Emergency Contact</dt>
                    <dd className="mt-1 text-slate-900">
                      {driver.emergency_contact_name}
                      {driver.emergency_contact_relationship && (
                        <span className="text-slate-500"> ({driver.emergency_contact_relationship})</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-600">Emergency Phone</dt>
                    <dd className="mt-1 text-slate-900">{driver.emergency_contact_phone}</dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          {/* Customer ratings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Customer Ratings</h3>
              {driver.ratings?.average != null && (
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold text-slate-900">{driver.ratings.average.toFixed(1)}</span>
                  <span className="text-amber-500">★</span>
                  <span className="text-sm text-slate-500">({driver.ratings.count})</span>
                </div>
              )}
            </div>
            {!driver.ratings || driver.ratings.count === 0 ? (
              <p className="text-sm text-slate-500">No customer ratings yet.</p>
            ) : (
              <div className="space-y-3">
                {driver.ratings.recent.map((r: any, i: number) => (
                  <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-500">{"★".repeat(r.rating)}<span className="text-slate-300">{"★".repeat(5 - r.rating)}</span></span>
                      <span className="font-mono text-xs text-slate-400">{r.reference}</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-600">{r.customerName}</p>
                    {r.feedback && <p className="mt-1 text-sm italic text-slate-700">“{r.feedback}”</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <DriverDocuments driverId={driverId} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Employment Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900">Employment</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-slate-600">Default Pay %</dt>
                <dd className="mt-1 text-2xl font-bold text-slate-900">
                  {driver.default_pay_percentage}%
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-600">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      driver.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {DRIVER_STATUS_LABELS[driver.status as keyof typeof DRIVER_STATUS_LABELS]}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Stats Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900">Statistics</h3>
            <dl className="space-y-4">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Truck className="h-4 w-4" />
                  Total Jobs
                </dt>
                <dd className="text-2xl font-bold text-slate-900">{driver.job_count || 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <PoundSterling className="h-4 w-4" />
                  Total Earned
                </dt>
                <dd className="text-2xl font-bold text-slate-900">
                  £{(driver.earnings_summary?.total || 0).toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Earnings Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900">Earnings Breakdown</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Pending</dt>
                <dd className="font-medium text-amber-600">
                  £{(driver.earnings_summary?.pending || 0).toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Approved</dt>
                <dd className="font-medium text-green-600">
                  £{(driver.earnings_summary?.approved || 0).toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Paid Out</dt>
                <dd className="font-medium text-slate-900">
                  £{(driver.earnings_summary?.paid || 0).toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
