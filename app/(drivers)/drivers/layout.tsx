"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  CalendarCheck,
  Truck,
  PoundSterling,
  User,
  LogOut,
} from "lucide-react";
import { Toaster } from "sonner";

const TABS = [
  { name: "Today", href: "/drivers/jobs/today", icon: CalendarCheck },
  { name: "Jobs", href: "/drivers/jobs", icon: Truck },
  { name: "Earnings", href: "/drivers/earnings", icon: PoundSterling },
  { name: "Profile", href: "/drivers/profile", icon: User },
];

export default function DriversLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [driverName, setDriverName] = useState("Driver");
  const [loading, setLoading] = useState(true);

  // Public, chrome-less driver pages (no nav, no auth gate)
  const isPublicPage =
    pathname === "/drivers/login" ||
    pathname === "/drivers/register" ||
    pathname.startsWith("/drivers/reset-password");

  useEffect(() => {
    if (isPublicPage) {
      setLoading(false);
      return;
    }
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function checkAuth() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/drivers/login");
      return;
    }

    const { data: driver } = await supabase
      .from("drivers")
      .select("first_name, preferred_name")
      .eq("auth_user_id", user.id)
      .single();

    if (driver) {
      setDriverName(driver.preferred_name || driver.first_name);
    }

    setLoading(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/drivers/login");
  }

  if (isPublicPage) {
    return (
      <>
        <Toaster position="top-center" />
        {children}
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-950">
        <div className="text-white">Loading…</div>
      </div>
    );
  }

  // App-shell layout: fixed top bar, scrollable content, fixed bottom tab
  // bar — no sidebar/hamburger. Reads like a native app rather than a
  // desktop admin panel squeezed onto a phone.
  return (
    <div className="flex h-dvh flex-col bg-slate-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <Toaster position="top-center" />

      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-purple-600">
            <Truck className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">Hi, {driverName}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav
        className="flex shrink-0 items-stretch justify-around border-t border-slate-200 bg-white"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
                isActive ? "text-brand-purple-700" : "text-slate-400"
              }`}
            >
              <tab.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
