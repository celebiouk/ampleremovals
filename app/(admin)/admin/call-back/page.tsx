"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, PhoneCall, Phone, ExternalLink, Clock } from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, isToday,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/admin/AdminSkeleton";
import { upperName } from "@/lib/utils";

interface Reminder {
  id: string;
  reminder_datetime: string; // stored as the picked wall-clock time (UTC)
  reason: string | null;
  notes: string | null;
  status: string; // pending | sent | completed
  booking_id: string | null;
  customer_name: string;
  phone: string | null;
}

// The picked time is stored as UTC, so read date/time straight from the ISO
// string — never via local/London conversion (which would shift it during BST).
const dayKeyOf = (iso: string) => iso.slice(0, 10);
const timeOf = (iso: string) => iso.slice(11, 16);

const STATUS_PILL: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  sent: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};
const statusLabel = (s: string) => (s === "completed" ? "Done" : s === "sent" ? "Reminder sent" : "To call");

export default function CallBackCalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    // Cover the whole visible grid (which spills into the prev/next month).
    const gridStart = format(startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const gridEnd = format(endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const { data } = await supabase
      .from("call_back_reminders")
      .select("id, reminder_datetime, reason, notes, status, booking_id, customers(full_name, phone)")
      .gte("reminder_datetime", `${gridStart}T00:00:00`)
      .lte("reminder_datetime", `${gridEnd}T23:59:59`)
      .order("reminder_datetime");
    setReminders((data ?? []).map((r: Record<string, unknown>) => {
      const cust = (Array.isArray(r.customers) ? r.customers[0] : r.customers) as { full_name?: string; phone?: string } | null;
      return {
        id: r.id as string,
        reminder_datetime: r.reminder_datetime as string,
        reason: (r.reason as string) ?? null,
        notes: (r.notes as string) ?? null,
        status: (r.status as string) ?? "pending",
        booking_id: (r.booking_id as string) ?? null,
        customer_name: cust?.full_name ?? "—",
        phone: cust?.phone ?? null,
      };
    }));
    setIsLoading(false);
  }, [currentMonth]);

  useEffect(() => { load(); }, [load]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });

  const remindersOnDay = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    return reminders
      .filter((r) => dayKeyOf(r.reminder_datetime) === key)
      .sort((a, b) => a.reminder_datetime.localeCompare(b.reminder_datetime));
  };

  const upcoming = reminders
    .filter((r) => r.status === "pending" && dayKeyOf(r.reminder_datetime) >= format(new Date(), "yyyy-MM-dd"))
    .slice(0, 12);

  const selectedReminders = selected ? remindersOnDay(selected) : [];

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-brand-purple-700" /> Call back
          </h2>
          <p className="text-sm text-slate-500">People to call back, by day. Tap a day to see everyone and their time.</p>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-slate-900">{format(currentMonth, "MMMM yyyy")}</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setCurrentMonth(new Date())} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Today</button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayReminders = remindersOnDay(day);
              const pending = dayReminders.filter((r) => r.status === "pending").length;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelectedDay = selected && isSameDay(day, selected);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelected(isSelectedDay ? null : day)}
                  className={`min-h-[84px] cursor-pointer border-b border-r border-slate-100 p-1.5 transition-colors last:border-r-0 hover:bg-slate-50
                    ${!isCurrentMonth ? "bg-slate-50/50" : ""} ${isSelectedDay ? "bg-purple-50 ring-1 ring-inset ring-purple-300" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium
                      ${isToday(day) ? "bg-brand-purple-700 text-white font-bold" : isCurrentMonth ? "text-slate-700" : "text-slate-300"}`}>
                      {format(day, "d")}
                    </span>
                    {pending > 0 && (
                      <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">{pending}</span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayReminders.slice(0, 2).map((r) => (
                      <div key={r.id} className={`truncate rounded px-1 py-0.5 text-[10px] font-semibold ${r.status === "completed" ? "bg-slate-100 text-slate-400 line-through" : "bg-amber-100 text-amber-800"}`}>
                        {timeOf(r.reminder_datetime)} {upperName(r.customer_name.split(" ")[0])}
                      </div>
                    ))}
                    {dayReminders.length > 2 && <p className="text-[10px] text-slate-400">+{dayReminders.length - 2} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected day list */}
        {selected && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900">{format(selected, "EEEE, d MMMM yyyy")}</h3>
            {selectedReminders.length === 0 ? (
              <p className="text-sm text-slate-400">No call-backs scheduled for this day.</p>
            ) : (
              <div className="space-y-3">
                {selectedReminders.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-purple-50 px-2 py-0.5 text-xs font-bold text-brand-purple-800">
                            <Clock className="h-3 w-3" /> {timeOf(r.reminder_datetime)}
                          </span>
                          <p className="truncate font-semibold text-slate-800">{upperName(r.customer_name)}</p>
                        </div>
                        {r.reason && <p className="mt-1 text-sm text-slate-500">{r.reason.replace(/_/g, " ")}</p>}
                        {r.notes && <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{r.notes}</p>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_PILL[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {statusLabel(r.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-green-500">
                          <Phone className="h-3.5 w-3.5" /> Call {r.phone}
                        </a>
                      )}
                      {r.booking_id && (
                        <button onClick={() => router.push(`/admin/bookings/${r.booking_id}`)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                          <ExternalLink className="h-3.5 w-3.5" /> Booking
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upcoming sidebar */}
      <div className="hidden xl:block w-72 shrink-0">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-semibold text-slate-900">Next call-backs</h3></div>
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <PhoneCall className="mb-2 h-8 w-8 text-slate-200" />
              <p className="text-sm text-slate-400">No one to call back</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {upcoming.map((r) => (
                <div key={r.id} className="px-5 py-3">
                  <p className="text-xs font-semibold text-brand-purple-700">
                    {new Date(r.reminder_datetime).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short" })} · {timeOf(r.reminder_datetime)}
                  </p>
                  <p className="font-medium text-sm text-slate-800">{upperName(r.customer_name)}</p>
                  {r.phone && <a href={`tel:${r.phone}`} className="text-xs text-brand-green-600">{r.phone}</a>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
