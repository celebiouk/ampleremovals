/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditDriverPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "suspended" | "on_leave">("active");
  const [defaultPayPercentage, setDefaultPayPercentage] = useState("0");

  useEffect(() => {
    loadDriver();
  }, [driverId]);

  async function loadDriver() {
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}`);
      const data = await response.json();

      if (data.success) {
        const d = data.driver;
        setDriver(d);
        setFirstName(d.first_name || "");
        setLastName(d.last_name || "");
        setPreferredName(d.preferred_name || "");
        setPhone(d.phone || "");
        setEmergencyContactName(d.emergency_contact_name || "");
        setEmergencyContactPhone(d.emergency_contact_phone || "");
        setStatus(d.status || "active");
        setDefaultPayPercentage(String(d.default_pay_percentage || 0));
      }
    } catch (error) {
      console.error("Failed to load driver:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/drivers/${driverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          preferred_name: preferredName || null,
          phone,
          emergency_contact_name: emergencyContactName || null,
          emergency_contact_phone: emergencyContactPhone || null,
          status,
          default_pay_percentage: parseFloat(defaultPayPercentage),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Driver updated successfully");
        router.push(`/admin/drivers/${driverId}`);
      } else {
        toast.error(data.error || "Failed to update driver");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update driver");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" />
      </div>
    );
  }

  if (!driver) {
    return <div className="text-center py-12"><p className="text-slate-600">Driver not found</p></div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/drivers/${driverId}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Driver</h1>
          <p className="text-slate-600">{driver.first_name} {driver.last_name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Personal Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">First Name *</label>
              <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Last Name *</label>
              <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Preferred Name</label>
              <input type="text" value={preferredName} onChange={(e) => setPreferredName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Phone *</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Emergency Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Contact Name</label>
              <input type="text" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Contact Phone</label>
              <input type="tel" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Employment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Default Pay % *</label>
              <input type="number" required min="0" max="100" step="0.5" value={defaultPayPercentage}
                onChange={(e) => setDefaultPayPercentage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href={`/admin/drivers/${driverId}`}
            className="rounded-xl border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-brand-purple-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-purple-700 disabled:opacity-50">
            {saving ? <><Loader2 className="h-5 w-5 animate-spin" />Saving...</> : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
