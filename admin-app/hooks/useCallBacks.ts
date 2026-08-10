/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface CallBackReminder {
  id: string;
  reminder_datetime: string; // picked wall-clock time, stored as UTC
  reason: string | null;
  notes: string | null;
  status: string; // pending | sent | completed
  booking_id: string | null;
  customer_name: string;
  phone: string | null;
}

async function loadCallBacks(): Promise<CallBackReminder[]> {
  const { data, error } = await supabase
    .from("call_back_reminders")
    .select("id, reminder_datetime, reason, notes, status, booking_id, customers(full_name, phone)")
    .order("reminder_datetime", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    reminder_datetime: r.reminder_datetime,
    reason: r.reason ?? null,
    notes: r.notes ?? null,
    status: r.status ?? "pending",
    booking_id: r.booking_id ?? null,
    customer_name: r.customers?.full_name ?? "—",
    phone: r.customers?.phone ?? null,
  }));
}

export function useCallBacks() {
  return useQuery({ queryKey: ["call-backs"], queryFn: loadCallBacks });
}

/** The date/time were stored as UTC, so read them straight off the ISO string
 *  (no local/London conversion, which would shift them during BST). */
export const cbDayKey = (iso: string) => iso.slice(0, 10);
export const cbTime = (iso: string) => iso.slice(11, 16);
