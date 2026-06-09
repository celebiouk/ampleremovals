"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";

export default function DriverLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      if (!data.user) {
        toast.error("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // Check user type via API
      const userTypeResponse = await fetch("/api/drivers/check-user-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      });

      const { userType } = await userTypeResponse.json();

      if (userType === "admin") {
        toast.error(
          "This login is for drivers only. Please use the admin login at /admin/login"
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (userType === "driver") {
        toast.success("Welcome back!");
        router.push("/drivers/dashboard");
        return;
      }

      // Unknown user type
      toast.error("Account not found. Please contact your manager.");
      await supabase.auth.signOut();
      setLoading(false);
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-purple-600">
              <Truck className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="mb-2 inline-block rounded-full bg-brand-purple-600/10 px-4 py-1.5">
            <span className="text-sm font-semibold text-brand-purple-400">
              Driver Portal
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white">Welcome Back</h1>
          <p className="mt-2 text-slate-400">
            Sign in to view your jobs and earnings
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20 disabled:opacity-50"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20 disabled:opacity-50"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <a
                href="/drivers/reset-password"
                className="text-sm text-brand-purple-400 hover:text-brand-purple-300"
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-purple-600/20 transition-all hover:bg-brand-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Driver accounts are created by your manager.
          <br />
          Contact your supervisor if you cannot log in.
        </p>
      </div>
    </div>
  );
}
