"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Building2, Bell, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Settings {
  company_name: string; company_phone: string; company_email: string;
  company_address: string; google_review_link: string;
  notify_new_booking: boolean; notify_invoice_paid: boolean;
  notify_invoice_overdue: boolean; overdue_days: number;
  notify_move_date_tomorrow: boolean;
}

const defaultSettings: Settings = {
  company_name: "Ample Removals", company_phone: "07344 683477",
  company_email: "", company_address: "", google_review_link: "",
  notify_new_booking: true, notify_invoice_paid: true,
  notify_invoice_overdue: true, overdue_days: 7, notify_move_date_tomorrow: true,
};

const TABS = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: User },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
] as const;
type TabId = typeof TABS[number]["id"];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-brand-green-600" : "bg-slate-300"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400 focus:ring-1 focus:ring-brand-purple-100" />
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("company");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
      if (data) setSettings({ ...defaultSettings, ...data });
    };
    load();
  }, []);

  const save = async () => {
    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("settings").upsert({ id: 1, ...settings, updated_at: new Date().toISOString() });
    if (!error) toast.success("Settings saved");
    else toast.error("Failed to save settings");
    setIsSaving(false);
  };

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) { toast.success("Password updated"); setNewPassword(""); setConfirmPassword(""); }
    else toast.error("Failed to update password");
  };

  const signOutAll = async () => {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    window.location.href = "/admin/login";
  };

  const set = (key: keyof Settings) => (value: string | boolean | number) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Manage your account and platform configuration</p>
      </div>

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-brand-purple-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-2xl">
        {activeTab === "company" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Company Details</h3>
            <InputField label="Company Name" value={settings.company_name} onChange={set("company_name")} />
            <InputField label="Phone Number" value={settings.company_phone} onChange={set("company_phone")} />
            <InputField label="Email Address" type="email" value={settings.company_email} onChange={set("company_email")} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
              <textarea value={settings.company_address} onChange={e => set("company_address")(e.target.value)} rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-purple-400" />
            </div>
            <InputField label="Google Review Link" value={settings.google_review_link} onChange={set("google_review_link")} placeholder="https://g.page/..." />
            <button onClick={save} disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-brand-purple-800 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
            </button>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-5">
            <h3 className="font-semibold text-slate-900">Notification Preferences</h3>
            {[
              { key: "notify_new_booking" as const, label: "New booking submitted", desc: "Get notified when a customer submits a new booking" },
              { key: "notify_invoice_paid" as const, label: "Invoice paid", desc: "Get notified when a customer pays an invoice" },
              { key: "notify_invoice_overdue" as const, label: "Invoice overdue", desc: "Get notified when an invoice becomes overdue" },
              { key: "notify_move_date_tomorrow" as const, label: "Move date tomorrow", desc: "Daily reminder for jobs scheduled for tomorrow" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <Toggle checked={settings[key] as boolean} onChange={v => set(key)(v)} />
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mark invoice overdue after (days)</label>
              <input type="number" min={1} max={90} value={settings.overdue_days}
                onChange={e => set("overdue_days")(Number(e.target.value))}
                className="h-10 w-24 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400" />
            </div>
            <button onClick={save} disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-brand-purple-800 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
            </button>
          </div>
        )}

        {activeTab === "account" && (
          <div className="space-y-5">
            <h3 className="font-semibold text-slate-900">Change Password</h3>
            <div className="space-y-3">
              <InputField label="New Password" type="password" value={newPassword} onChange={setNewPassword} placeholder="Minimum 8 characters" />
              <InputField label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} />
            </div>
            <button onClick={updatePassword}
              className="flex items-center gap-2 rounded-xl bg-brand-purple-800 px-5 py-2.5 text-sm font-bold text-white">
              <Save className="h-4 w-4" /> Update Password
            </button>
          </div>
        )}

        {activeTab === "danger" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Danger Zone</h3>
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="font-semibold text-red-800">Sign out all sessions</p>
              <p className="mt-1 text-sm text-red-600">This will sign out all active admin sessions across all devices.</p>
              <button onClick={() => { if (confirm("Sign out all sessions? You will be redirected to login.")) signOutAll(); }}
                className="mt-3 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                Sign Out All Sessions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
