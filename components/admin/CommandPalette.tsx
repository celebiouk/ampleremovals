"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard, Kanban, ClipboardList, Users, CalendarDays,
  BarChart2, Zap, Receipt, CreditCard, Settings, Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface BookingResult { id: string; reference: string; customer_name: string; service_type: string }

const PAGES = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Pipeline (Kanban)", href: "/admin/pipeline", icon: Kanban },
  { label: "Bookings", href: "/admin/bookings", icon: ClipboardList },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Calendar", href: "/admin/calendar", icon: CalendarDays },
  { label: "Reports", href: "/admin/reports", icon: BarChart2 },
  { label: "Automations", href: "/admin/automations", icon: Zap },
  { label: "Invoices", href: "/admin/invoices", icon: Receipt },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [bookings, setBookings] = useState<BookingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setBookings([]); return; }
    setIsSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("bookings")
      .select("id, reference, service_type, customers!inner(full_name)")
      .or(`reference.ilike.%${q}%`)
      .limit(5);
    setBookings((data ?? []).map((b: Record<string, unknown>) => ({
      id: b.id as string,
      reference: b.reference as string,
      service_type: b.service_type as string,
      customer_name: (b.customers as { full_name: string } | null)?.full_name ?? "—",
    })));
    setIsSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    if (!open) { setQuery(""); setBookings([]); }
  }, [open]);

  const navigate = (href: string) => { router.push(href); onClose(); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <Command className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search bookings, pages, actions…"
              className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">ESC</kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-slate-400">
              {isSearching ? "Searching…" : "No results found"}
            </Command.Empty>

            {bookings.length > 0 && (
              <Command.Group heading="Bookings" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-slate-400">
                {bookings.map(b => (
                  <Command.Item key={b.id} value={b.reference}
                    onSelect={() => navigate(`/admin/bookings/${b.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 aria-selected:bg-purple-50 aria-selected:text-purple-900">
                    <ClipboardList className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="font-mono font-semibold text-purple-700">{b.reference}</span>
                    <span className="text-slate-500">— {b.customer_name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Pages" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-slate-400">
              {PAGES.filter(p => !query || p.label.toLowerCase().includes(query.toLowerCase())).map(p => (
                <Command.Item key={p.href} value={p.label}
                  onSelect={() => navigate(p.href)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 aria-selected:bg-purple-50 aria-selected:text-purple-900">
                  <p.icon className="h-4 w-4 shrink-0 text-slate-400" />
                  {p.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-4 text-xs text-slate-400">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
