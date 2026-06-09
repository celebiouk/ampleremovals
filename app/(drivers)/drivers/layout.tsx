"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  LayoutDashboard,
  Truck,
  CalendarCheck,
  PoundSterling,
  User,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Toaster } from "sonner";

const navigation = [
  { name: "My Dashboard", href: "/drivers/dashboard", icon: LayoutDashboard },
  { name: "My Jobs", href: "/drivers/jobs", icon: Truck },
  { name: "Today's Jobs", href: "/drivers/jobs/today", icon: CalendarCheck },
  { name: "Earnings", href: "/drivers/earnings", icon: PoundSterling },
  { name: "My Profile", href: "/drivers/profile", icon: User },
  { name: "Documents", href: "/drivers/documents", icon: FileText },
];

export default function DriversLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [driverName, setDriverName] = useState("Driver");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAuth() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/drivers/login");
      return;
    }

    // Fetch driver details
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Toaster position="top-right" />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-950 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple-600">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Ample Removals</div>
                <div className="text-xs text-slate-400">Driver Portal</div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-brand-purple-600 to-brand-purple-700 text-white shadow-lg"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-800 p-4">
            <div className="mb-3 rounded-xl bg-slate-900 px-4 py-3">
              <div className="text-sm font-semibold text-white">{driverName}</div>
              <div className="text-xs text-slate-400">Driver</div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-slate-900"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="hidden lg:block text-lg font-semibold text-slate-900">
            {navigation.find((item) => pathname === item.href)?.name || "Driver Portal"}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-slate-600">
              {driverName}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
