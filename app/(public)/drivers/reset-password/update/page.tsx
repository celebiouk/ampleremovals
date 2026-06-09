"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function DriverUpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Supabase establishes a temporary recovery session from the email link.
    const supabase = createClient();

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setHasSession(!!session);
      setCheckingSession(false);
    }

    // Listen for the PASSWORD_RECOVERY event fired when the link is opened
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasSession(true);
        setCheckingSession(false);
      }
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message || "Could not update password");
        setLoading(false);
        return;
      }

      toast.success("Password updated! Please log in.");
      await supabase.auth.signOut();
      router.push("/drivers/login");
    } catch (err) {
      console.error("Update password error:", err);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple-500" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-white">Link Expired</h1>
          <p className="mb-6 text-slate-400">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/drivers/reset-password"
            className="inline-block rounded-xl bg-brand-purple-600 px-6 py-3 font-semibold text-white hover:bg-brand-purple-700"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-purple-600">
              <Truck className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white">Set New Password</h1>
          <p className="mt-2 text-slate-400">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-900 p-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
          />
          <label className="mb-2 block text-sm font-medium text-slate-300">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-type password"
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-600 px-6 py-3 font-semibold text-white hover:bg-brand-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" />
                Update Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
