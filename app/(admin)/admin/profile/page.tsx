"use client";

import { useEffect, useState, useCallback } from "react";
import { User, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Profile { email: string; full_name: string | null; role: string | null }

/** My Profile — edit the admin's display name. Mirrors the mobile profile screen. */
export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/profile", { cache: "no-store" });
      const json = await res.json();
      const p: Profile = { email: json.email ?? "", full_name: json.full_name ?? null, role: json.role ?? null };
      setProfile(p);
      const [f, ...rest] = (p.full_name ?? "").trim().split(" ");
      setFirst(f ?? ""); setLast(rest.join(" "));
    } catch { /* non-fatal */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!first.trim()) { toast.error("Please enter your first name"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: first, lastName: last }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || "Couldn't save");
      // Refresh the session so the greeting picks up the new name.
      await createClient().auth.refreshSession();
      toast.success("Profile updated");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally { setSaving(false); }
  }

  const initials = [first, last].filter(Boolean).map((s) => s[0]?.toUpperCase()).join("") || "?";
  const input = "h-11 w-full rounded-xl border-2 border-slate-200 px-3 text-base outline-none focus:border-brand-purple-600";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple-800 text-white"><User className="h-6 w-6" /></span>
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">My Profile</h2>
          <p className="text-sm text-slate-500">Your name and account details.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-brand-purple-800 to-brand-purple-950 p-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white">{initials}</span>
            <p className="text-lg font-bold text-white">{[first, last].filter(Boolean).join(" ") || "—"}</p>
            <p className="text-sm text-white/80">{profile?.email}</p>
            {profile?.role && <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white">{profile.role === "super_admin" ? "Super Admin" : "Admin"}</span>}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">First name</label><input className={input} value={first} onChange={(e) => setFirst(e.target.value)} placeholder="e.g. Rafael" /></div>
            <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Last name</label><input className={input} value={last} onChange={(e) => setLast(e.target.value)} placeholder="e.g. Mendel" /></div>
            <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-800 py-2.5 text-sm font-bold text-white hover:bg-brand-purple-900 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
            </button>
          </div>
        </>
      )}
    </div>
  );
}
