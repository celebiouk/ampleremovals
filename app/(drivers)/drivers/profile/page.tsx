/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DriverProfilePage() {
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preferredName, setPreferredName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
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

    if (driverData) {
      setDriver(driverData);
      setPreferredName(driverData.preferred_name || "");
      setPhone(driverData.phone || "");
      setEmergencyContactName(driverData.emergency_contact_name || "");
      setEmergencyContactPhone(driverData.emergency_contact_phone || "");
    }

    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("drivers")
        .update({
          preferred_name: preferredName || null,
          phone,
          emergency_contact_name: emergencyContactName || null,
          emergency_contact_phone: emergencyContactPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_user_id", user.id);

      if (error) {
        toast.error("Failed to save profile");
        console.error(error);
      } else {
        toast.success("Profile updated successfully");
        loadProfile();
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save profile");
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
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-600">Manage your personal information</p>
      </div>

      {/* Personal Details (Read-Only) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Personal Details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600">
              Full Name
            </label>
            <div className="mt-1 flex items-center gap-2 text-slate-900">
              <User className="h-4 w-4 text-slate-400" />
              {driver.first_name} {driver.last_name}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <div className="mt-1 flex items-center gap-2 text-slate-900">
              <Mail className="h-4 w-4 text-slate-400" />
              {driver.email}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">
              Date of Birth
            </label>
            <div className="mt-1 flex items-center gap-2 text-slate-900">
              <Calendar className="h-4 w-4 text-slate-400" />
              {new Date(driver.date_of_birth).toLocaleDateString("en-GB")}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Contact your manager to update these details
        </p>
      </div>

      {/* Editable Details */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Contact Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Preferred Name (optional)
            </label>
            <input
              type="text"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              placeholder="What you like to be called"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Emergency Contact
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Contact Name
            </label>
            <input
              type="text"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
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
              placeholder="e.g. 07123456789"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-brand-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-purple-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
