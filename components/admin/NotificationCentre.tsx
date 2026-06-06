"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCheck, ClipboardList, Receipt, AlertCircle, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Notification {
  id: string; type: string; title: string; description: string;
  booking_id: string | null; is_read: boolean; created_at: string;
}

interface Props { open: boolean; onClose: () => void; onRead: () => void; }

function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  new_booking: ClipboardList,
  invoice_paid: Receipt,
  invoice_overdue: AlertCircle,
  move_date_tomorrow: CalendarDays,
};

export function NotificationCentre({ open, onClose, onRead }: Props) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
    setNotifs((data ?? []) as Notification[]);
    setIsLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const markAllRead = async () => {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    onRead();
  };

  const markRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20" onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.2 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-700" />
                <h2 className="font-semibold text-slate-900">Notifications</h2>
                {notifs.filter(n => !n.is_read).length > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {notifs.filter(n => !n.is_read).length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
                <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
              ) : notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bell className="mb-3 h-10 w-10 text-slate-200" />
                  <p className="font-medium text-slate-400">No notifications yet</p>
                </div>
              ) : notifs.map(n => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                return (
                  <div key={n.id}
                    className={`flex items-start gap-3 border-b border-slate-50 px-5 py-4 transition-colors ${!n.is_read ? "border-l-2 border-l-purple-600 bg-purple-50/50" : ""}`}>
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{n.description}</p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <span className="text-[11px] text-slate-400">{relTime(n.created_at)}</span>
                        {n.booking_id && (
                          <Link href={`/admin/bookings/${n.booking_id}`} onClick={onClose}
                            className="text-[11px] font-medium text-purple-600 hover:underline">View booking</Link>
                        )}
                        {!n.is_read && (
                          <button onClick={() => markRead(n.id)} className="text-[11px] text-slate-400 hover:text-slate-600">Mark read</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
