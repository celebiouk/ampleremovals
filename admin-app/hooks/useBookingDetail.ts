/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Booking, Customer, Address, Invoice } from "@/types";

export interface StatusHistoryRow {
  id: string;
  previous_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by: string | null;
}

export interface BookingDetail {
  booking: Booking;
  customer: Customer | null;
  origin: Address | null;
  destination: Address | null;
  invoices: Invoice[];
  statusHistory: StatusHistoryRow[];
}

async function loadDetail(bookingId: string): Promise<BookingDetail> {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (error || !booking) throw error ?? new Error("Booking not found");

  const [{ data: customer }, origin, destination, { data: invoices }, { data: statusHistory }] =
    await Promise.all([
      supabase.from("customers").select("*").eq("id", booking.customer_id).single(),
      booking.origin_address_id
        ? supabase.from("addresses").select("*").eq("id", booking.origin_address_id).single()
        : Promise.resolve({ data: null }),
      booking.destination_address_id
        ? supabase.from("addresses").select("*").eq("id", booking.destination_address_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("invoices").select("*").eq("booking_id", bookingId).order("created_at", { ascending: false }),
      supabase
        .from("status_history")
        .select("*")
        .eq("booking_id", bookingId)
        .order("changed_at", { ascending: false }),
    ]);

  return {
    booking: booking as Booking,
    customer: (customer as Customer) ?? null,
    origin: (origin as any)?.data ?? null,
    destination: (destination as any)?.data ?? null,
    invoices: (invoices as Invoice[]) ?? [],
    statusHistory: (statusHistory as StatusHistoryRow[]) ?? [],
  };
}

export function useBookingDetail(bookingId: string) {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => loadDetail(bookingId),
    enabled: !!bookingId,
  });
}
