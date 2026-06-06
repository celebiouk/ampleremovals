"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, isToday,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { ServiceBadge } from "@/components/admin/ServiceBadge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Skeleton } from "@/components/admin/AdminSkeleton";
import { formatDate } from "@/lib/utils";
import type { BookingStatus, ServiceType } from "@/types";

const SERVICE_BG: Record<ServiceType, string> = {
  removals: "bg-purple-600", man_and_van: "bg-blue-600",
  house_clearance: "bg-orange-500", house_cleaning: "bg-teal-600",
  end_of_tenancy: "bg-pink-600",
};

interface CalBooking {
  id: string; reference: string; service_type: ServiceType; status: BookingStatus;
  move_date: string; customer_name: string; phone: string;
  origin_postcode: string; destination_postcode: string | null;
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const { data } = await supabase
      .from("bookings")
      .select("id,reference,service_type,status,move_date,customers!inner(full_name,phone),origin_addr:addresses!origin_address_id(postcode),dest_addr:addresses!destination_address_id(postcode)")
      .not("move_date", "is", null)
      .gte("move_date", start)
      .lte("move_date", end)
      .order("move_date");
    setBookings((data ?? []).map((b: Record<string, unknown>) => ({
      id: b.id as string, reference: b.reference as string,
      service_type: b.service_type as ServiceType, status: b.status as BookingStatus,
      move_date: b.move_date as string,
      customer_name: (b.customers as { full_name: string; phone: string } | null)?.full_name ?? "—",
      phone: (b.customers as { full_name: string; phone: string } | null)?.phone ?? "",
      origin_postcode: (b.origin_addr as { postcode: string } | null)?.postcode ?? "—",
      destination_postcode: (b.dest_addr as { postcode: string } | null)?.postcode ?? null,
    })));
    setIsLoading(false);
  }, [currentMonth]);

  useEffect(() => { load(); }, [load]);

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const bookingsOnDay = (day: Date) =>
    bookings.filter(b => isSameDay(new Date(b.move_date), day));

  const upcoming = bookings.filter(b => new Date(b.move_date) >= new Date()).slice(0, 10);

  const selectedBookings = selected ? bookingsOnDay(selected) : [];

  return (
    <div className="flex gap-6">
      {/* Calendar */}
      <div className="flex-1 min-w-0 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setCurrentMonth(new Date())}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
              Today
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {days.map(day => {
              const dayBookings = bookingsOnDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelectedDay = selected && isSameDay(day, selected);
              const isTodayDay = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelected(isSelectedDay ? null : day)}
                  className={`min-h-[80px] cursor-pointer border-b border-r border-slate-100 p-1.5 transition-colors last:border-r-0 hover:bg-slate-50
                    ${!isCurrentMonth ? "bg-slate-50/50" : ""}
                    ${isSelectedDay ? "bg-purple-50 ring-1 ring-inset ring-purple-300" : ""}
                  `}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium
                    ${isTodayDay ? "bg-purple-700 text-white font-bold" : isCurrentMonth ? "text-slate-700" : "text-slate-300"}
                  `}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayBookings.slice(0, 2).map(b => (
                      <div key={b.id}
                        onClick={e => { e.stopPropagation(); router.push(`/admin/bookings/${b.id}`); }}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-semibold text-white cursor-pointer ${SERVICE_BG[b.service_type]}`}>
                        {b.customer_name.split(" ")[0]}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <p className="text-[10px] text-slate-400">+{dayBookings.length - 2} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected day bookings */}
        {selected && selectedBookings.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900">{format(selected, "EEEE, d MMMM yyyy")}</h3>
            <div className="space-y-3">
              {selectedBookings.map(b => (
                <div key={b.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 cursor-pointer"
                  onClick={() => router.push(`/admin/bookings/${b.id}`)}>
                  <ServiceBadge service={b.service_type} />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{b.customer_name}</p>
                    <p className="text-sm text-slate-500">{b.origin_postcode}{b.destination_postcode ? ` → ${b.destination_postcode}` : ""}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming sidebar */}
      <div className="hidden xl:block w-72 shrink-0">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold text-slate-900">Upcoming This Week</h3>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarDays className="mb-2 h-8 w-8 text-slate-200" />
              <p className="text-sm text-slate-400">No upcoming jobs</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {upcoming.map(b => (
                <div key={b.id} className="cursor-pointer px-5 py-3.5 hover:bg-slate-50" onClick={() => router.push(`/admin/bookings/${b.id}`)}>
                  <p className="text-xs font-semibold text-purple-700">{formatDate(b.move_date)}</p>
                  <p className="font-medium text-sm text-slate-800">{b.customer_name}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <ServiceBadge service={b.service_type} />
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
