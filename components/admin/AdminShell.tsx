"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Kanban, ClipboardList, Users, CalendarDays,
  Receipt, CreditCard, BarChart2, Zap, Settings, LogOut,
  ChevronLeft, ChevronRight, Bell, Plus, Search, Shield, Truck, PoundSterling, Sparkles,
  Calculator, TrendingDown, TrendingUp, Landmark,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { createClient } from "@/lib/supabase/client";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { NotificationCentre } from "@/components/admin/NotificationCentre";

const NAV_GROUPS = [
  {
    label: "OVERVIEW",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/pipeline", label: "Pipeline", icon: Kanban },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { href: "/admin/bookings", label: "Bookings", icon: ClipboardList, showBadge: true },
      { href: "/admin/cleaners", label: "Cleaners", icon: Sparkles },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/admin/drivers", label: "Drivers", icon: Truck },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { href: "/admin/invoices", label: "Invoices", icon: Receipt },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/earnings", label: "Driver Earnings", icon: PoundSterling },
      { href: "/admin/payroll", label: "Payroll", icon: PoundSterling },
    ],
  },
  {
    label: "BOOKKEEPING",
    items: [
      { href: "/admin/bookkeeping/year-end", label: "Year-End Tax", icon: Calculator },
      { href: "/admin/bookkeeping/expenses", label: "Expenses", icon: TrendingDown },
      { href: "/admin/bookkeeping/income", label: "Other Income", icon: TrendingUp },
      { href: "/admin/bookkeeping/director-loan", label: "Director's Loan", icon: Landmark },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { href: "/admin/reports", label: "Reports", icon: BarChart2 },
      { href: "/admin/automations", label: "Automations", icon: Zap },
    ],
  },
];

function SidebarLink({
  href, label, icon: Icon, exact = false, badge = 0, collapsed = false,
}: {
  href: string; label: string; icon: React.ElementType;
  exact?: boolean; badge?: number; collapsed?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        collapsed ? "justify-center px-2" : "",
        active
          ? "bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-sm"
          : "text-purple-200 hover:bg-purple-900/50 hover:text-white"
      )}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {badge > 0 && (
        <span className={cn(
          "flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse",
          collapsed ? "absolute -right-1 -top-1" : "ml-auto"
        )}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-2 hidden rounded-lg bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg group-hover:block whitespace-nowrap z-50">
          {label}
        </span>
      )}
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored) setCollapsed(stored === "true");
  }, []);

  const toggleCollapsed = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }, [collapsed]);

  useEffect(() => {
    const fetchInquiries = async () => {
      const supabase = createClient();
      const { count } = await supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "inquiry");
      setInquiryCount(count ?? 0);
    };
    fetchInquiries();
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      const supabase = createClient();
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("is_read", false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
  }, []);

  // ⌘K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") { e.preventDefault(); toggleCollapsed(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [collapsed, toggleCollapsed]);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;

  const handleSignOut = async () => { await signOut(); router.replace("/admin/login"); };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() ?? "AD";
  const sidebarWidth = collapsed ? "w-[72px]" : "w-[280px]";

  const SidebarContent = () => (
    <div className="flex h-full flex-col" style={{ background: "#1e1040" }}>
      {/* Logo */}
      <div className={cn("flex h-16 shrink-0 items-center border-b border-purple-900/50 px-4", collapsed ? "justify-center" : "gap-3 px-5")}>
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl">
          <Image
            src="/logo.png"
            alt="Ample Removals"
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </div>
        {!collapsed && (
          <span className="font-display text-base font-extrabold text-white tracking-tight">Ample CRM</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-purple-500">
                {group.label}
              </p>
            )}
            {collapsed && <div className="my-2 border-t border-purple-900/40" />}
            {group.items.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                exact={"exact" in item ? item.exact : false}
                badge={"showBadge" in item && item.showBadge ? inquiryCount : 0}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-purple-900/50 p-3 space-y-1">
        <SidebarLink href="/admin/manage-admins" label="Manage Admins" icon={Shield} collapsed={collapsed} />
        <SidebarLink href="/admin/settings" label="Settings" icon={Settings} collapsed={collapsed} />
        {!collapsed && (
          <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-700 text-xs font-bold text-white">
              {userInitials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-purple-200">{user?.email ?? "Admin"}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-900/50 hover:text-red-400",
            collapsed ? "justify-center" : ""
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Sign out"}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-900/50 hover:text-purple-200 mt-1",
            collapsed ? "justify-center" : ""
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden flex-col transition-all duration-200 md:flex", sidebarWidth)}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "tween", duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] md:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={cn("flex min-h-screen flex-1 flex-col transition-all duration-200", collapsed ? "md:pl-[72px]" : "md:pl-[280px]")}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm">
          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)} className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-purple-800 text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="3" y1="12" x2="21" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="3" y1="18" x2="21" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Search trigger */}
          <button onClick={() => setCmdOpen(true)}
            className="flex flex-1 max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 transition-colors hover:border-purple-300 hover:bg-white">
            <Search className="h-4 w-4" />
            <span>Search anything…</span>
            <kbd className="ml-auto hidden rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 sm:block">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* Quick add */}
            <Link href="/booking/removals"
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-brand-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-green-500">
              <Plus className="h-4 w-4" /> New Booking
            </Link>

            {/* Notifications */}
            <button onClick={() => setNotifOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-700 text-xs font-bold text-white cursor-default">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Page content with animation */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex-1 p-6"
        >
          {children}
        </motion.main>
      </div>

      {/* Command palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Notification centre */}
      <NotificationCentre open={notifOpen} onClose={() => setNotifOpen(false)} onRead={() => setUnreadCount(0)} />
    </div>
  );
}

export default AdminShell;
