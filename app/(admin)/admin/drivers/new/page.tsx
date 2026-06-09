/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateDriverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "suspended" | "on_leave">("active");
  const [defaultPayPercentage, setDefaultPayPercentage] = useState("40");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (!firstName || !lastName || !dateOfBirth || !email || !phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Age validation (must be 18+)
    const birthDate = new Date(dateOfBirth);
    const age = Math.floor((new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      toast.error("Driver must be at least 18 years old");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          preferredName: preferredName || null,
          dateOfBirth,
          email,
          phone,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          status,
          defaultPayPercentage: parseFloat(defaultPayPercentage),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to create driver");
        setLoading(false);
        return;
      }

      toast.success(`Driver account created! Temporary password: ${data.temporaryPassword}`);
      router.push(`/admin/drivers/${data.driver.id}`);
    } catch (error) {
      console.error("Create driver error:", error);
      toast.error("Failed to create driver");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/drivers"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Driver</h1>
          <p className="text-slate-600">Create a new driver account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Personal Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Preferred Name (optional)
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="What they like to be called"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@example.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07123456789"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Emergency Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contact Name
              </label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contact Phone
              </label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="07123456789"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
              />
            </div>
          </div>
        </div>

        {/* Employment */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Employment Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Default Pay % <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.5"
                  value={defaultPayPercentage}
                  onChange={(e) => setDefaultPayPercentage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 pr-10 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                  %
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                e.g. 40 means driver receives 40% of booking total
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/drivers"
            className="rounded-xl border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Driver Account"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
