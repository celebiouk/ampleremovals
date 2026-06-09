/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export default function DriverDocumentsPage() {
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: driverData } = await supabase
      .from("drivers")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    setDriver(driverData);
    setLoading(false);
  }

  function isLicenceExpiringSoon(): boolean {
    if (!driver?.driving_licence_expiry) return false;
    const expiry = new Date(driver.driving_licence_expiry);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  }

  function isLicenceExpired(): boolean {
    if (!driver?.driving_licence_expiry) return false;
    const expiry = new Date(driver.driving_licence_expiry);
    return expiry < new Date();
  }

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
        <p className="text-slate-600">Profile not found</p>
      </div>
    );
  }

  const documents = [
    {
      name: "Profile Photo",
      uploaded: !!driver.profile_photo_url,
      url: driver.profile_photo_url,
    },
    {
      name: "Driving Licence (Front)",
      uploaded: !!driver.driving_licence_front_url,
      url: driver.driving_licence_front_url,
    },
    {
      name: "Driving Licence (Back)",
      uploaded: !!driver.driving_licence_back_url,
      url: driver.driving_licence_back_url,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>
        <p className="text-slate-600">
          View your uploaded documents and licence details
        </p>
      </div>

      {/* Licence Expiry Warning */}
      {(isLicenceExpired() || isLicenceExpiringSoon()) && (
        <div
          className={`rounded-2xl border-2 p-6 ${
            isLicenceExpired()
              ? "border-red-200 bg-red-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-6 w-6 flex-shrink-0 ${
                isLicenceExpired() ? "text-red-600" : "text-amber-600"
              }`}
            />
            <div>
              <h3
                className={`font-semibold ${
                  isLicenceExpired() ? "text-red-900" : "text-amber-900"
                }`}
              >
                {isLicenceExpired()
                  ? "Driving Licence Expired"
                  : "Driving Licence Expiring Soon"}
              </h3>
              <p
                className={`mt-1 text-sm ${
                  isLicenceExpired() ? "text-red-700" : "text-amber-700"
                }`}
              >
                Your driving licence{" "}
                {isLicenceExpired() ? "expired" : "expires"} on{" "}
                {new Date(driver.driving_licence_expiry).toLocaleDateString(
                  "en-GB"
                )}
                . Please renew it and inform your manager as soon as possible.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Driving Licence Details */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Driving Licence Details
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-600">
              Licence Number
            </label>
            <div className="mt-1 font-mono text-slate-900">
              {driver.driving_licence_number
                ? `•••••${driver.driving_licence_number.slice(-4)}`
                : "Not recorded"}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">
              Expiry Date
            </label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-slate-900">
                {driver.driving_licence_expiry
                  ? new Date(driver.driving_licence_expiry).toLocaleDateString(
                      "en-GB"
                    )
                  : "Not recorded"}
              </span>
              {driver.driving_licence_expiry && !isLicenceExpired() && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Uploaded Documents
        </h2>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.name}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{doc.name}</div>
                  <div className="text-sm text-slate-500">
                    {doc.uploaded ? "Uploaded" : "Not uploaded"}
                  </div>
                </div>
              </div>
              {doc.uploaded ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Uploaded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Not uploaded
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Please ask your manager to upload missing documents
        </p>
      </div>
    </div>
  );
}
