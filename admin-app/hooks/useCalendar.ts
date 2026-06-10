/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BookingStatus, ServiceType } from "@/types";

export interface CalendarBooking {
  id: string;
  reference: string;
  service_type: ServiceType;
  status: BookingStatus;
  move_date: string;
  customer_name: string;
  origin_postcode: string;
  destination_postcode: string | null;
}

async function loadCalendar(): Promise<CalendarBooking[]> {
  // Jobs from the start of last month onward (covers the visible calendar).
  const from = new Date();
  from.setMonth(from.getMonth() - 1, 1);

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id, reference, service_type, status, move_date,
      customers!inner(full_name),
      origin_addr:addresses!origin_address_id(postcode),
      dest_addr:addresses!destination_address_id(postcode)
    `
    )
    .not("move_date", "is", null)
    .gte("move_date", from.toISOString().slice(0, 10))
    .order("move_date", { ascending: true })
    .limit(500);

  if (error) throw error;

  return (data ?? []).map((b: any) => ({
    id: b.id,
    reference: b.reference,
    service_type: b.service_type,
    status: b.status,
    move_date: b.move_date,
    customer_name: b.customers?.full_name ?? "—",
    origin_postcode: b.origin_addr?.postcode ?? "—",
    destination_postcode: b.dest_addr?.postcode ?? null,
  }));
}

export function useCalendar() {
  return useQuery({ queryKey: ["calendar"], queryFn: loadCalendar });
}
