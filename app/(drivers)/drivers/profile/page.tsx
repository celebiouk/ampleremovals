/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Calendar, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

export default function DriverProfilePage() {
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preferredName, setPreferredName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState("");

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setEmergencyContactRelationship(driverData.emergency_contact_relationship || "");

      // Resolve a signed URL for the stored photo (RLS allows drivers to read own folder)
      if (driverData.profile_photo_url) {
        const { data: signed } = await supabase.storage
          .from("driver-documents")
          .createSignedUrl(driverData.profile_photo_url, 3600);
        if (signed?.signedUrl) setPhotoUrl(signed.signedUrl);
      }
    }

    setLoading(false);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/drivers/profile/photo", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setPhotoUrl(data.signedUrl);
        toast.success("Photo updated");
      } else {
        toast.error(data.error || "Failed to upload photo");
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
          emergency_contact_relationship: emergencyContactRelationship || null,
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

      {/* Profile Photo */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-200"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-purple-100 text-2xl font-bold text-brand-purple-700">
                {driver.first_name?.[0]}{driver.last_name?.[0]}
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {uploadingPhoto ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  {photoUrl ? "Change Photo" : "Upload Photo"}
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-slate-500">JPG or PNG, max 5MB</p>
          </div>
        </div>
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
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Relationship
            </label>
            <input
              type="text"
              value={emergencyContactRelationship}
              onChange={(e) => setEmergencyContactRelationship(e.target.value)}
              placeholder="e.g. Spouse, Parent, Friend"
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
