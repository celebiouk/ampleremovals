"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  title: string;
  description: string;
  booking_id: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      setNotifications(data ?? []);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  async function markRead(id: string) {
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  }

  async function markAllRead() {
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  }

  const unread = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-slate-200 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Notifications {unread > 0 && `(${unread})`}
          </h1>
          <p className="text-slate-600">System and booking notifications</p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-purple-50 hover:bg-brand-purple-100 text-brand-purple-700 font-medium text-sm"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Bell className="h-8 w-8 mb-2 opacity-50" />
            <p>All caught up — no notifications.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => {
                if (!notification.is_read) markRead(notification.id);
                if (notification.booking_id) {
                  router.push(`/admin/bookings/${notification.booking_id}`);
                }
              }}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                notification.is_read
                  ? "border-slate-200 bg-white hover:bg-slate-50"
                  : "border-brand-purple-200 bg-brand-purple-50 hover:bg-brand-purple-100"
              }`}
            >
              <div className="flex items-start gap-3">
                {!notification.is_read && (
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-brand-purple-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{notification.title}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{notification.description}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDateTime(notification.created_at)}
                  </p>
                </div>
                {notification.booking_id && (
                  <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
