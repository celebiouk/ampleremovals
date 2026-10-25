"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarCheck,
  Truck,
  PoundSterling,
  User,
  FileText,
  LogOut,
} from "lucide-react";
import { Toaster } from "sonner";

// Full set — all of these show on the desktop sidebar. The mobile bottom bar
// uses a shorter subset (see MOBILE_TABS below) since a phone screen can't
// fit six tabs; Documents/Dashboard stay one tap away via Profile on mobile.
const NAV_ITEMS = [
  { name: "Dashboard", href: "/drivers/dashboard", icon: LayoutDashboard },
  { name: "Today", href: "/drivers/jobs/today", icon: CalendarCheck },
  { name: "Jobs", href: "/drivers/jobs", icon: Truck },
  { name: "Earnings", href: "/drivers/earnings", icon: PoundSterling },
  { name: "Documents", href: "/drivers/documents", icon: FileText },
  { name: "Profile", href: "/drivers/profile", icon: User },
];
const MOBILE_TABS = NAV_ITEMS.filter((i) => ["Today", "Jobs", "Earnings", "Profile"].includes(i.name));

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

  // Phone: app-shell with a bottom tab bar. Tablet/laptop (md+): a proper
  // sidebar with every section, no bottom bar — a phone-width chrome
  // stretched across a laptop screen looked broken and hid most of the nav.
  return (
    <div className="flex h-dvh bg-slate-50 md:flex-row" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <Toaster position="top-center" />

      {/* Desktop/tablet sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple-600">
            <Truck className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Ample Removals</div>
            <div className="text-xs text-slate-400">Driver Portal</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-purple-50 text-brand-purple-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 px-2 text-sm font-semibold text-slate-900">{driverName}</div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phone top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
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
        <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>

        {/* Phone bottom tab bar */}
        <nav
          className="flex shrink-0 items-stretch justify-around border-t border-slate-200 bg-white md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {MOBILE_TABS.map((tab) => {
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
    </div>
  );
}
