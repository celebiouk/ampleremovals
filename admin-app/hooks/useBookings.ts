/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Booking, BookingStatus } from "@/types";

export interface BookingRow extends Booking {
  customer_name: string;
  origin_postcode: string;
  destination_postcode: string | null;
}

interface Filters {
  search: string;
  status: BookingStatus | "";
  service?: string;
}

async function loadBookings({ search, status, service }: Filters): Promise<BookingRow[]> {
  let query = supabase
    .from("bookings")
    .select(
      `
      *,
      customers!inner(full_name, email),
      origin_addr:addresses!origin_address_id(postcode),
      dest_addr:addresses!destination_address_id(postcode)
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (service) query = query.eq("service_type", service);

  const { data, error } = await query;
  if (error) throw error;

  const rows: BookingRow[] = (data ?? []).map((b: any) => ({
    ...(b as Booking),
    customer_name: b.customers?.full_name ?? "—",
    origin_postcode: b.origin_addr?.postcode ?? "—",
    destination_postcode: b.dest_addr?.postcode ?? null,
  }));

  return rows;
}

export function useBookings(filters: Filters) {
  return useQuery({
    queryKey: ["bookings", filters.status],
    // Fetch the full set per status; search filters the cached set client-side.
    queryFn: () => loadBookings({ search: "", status: filters.status }),
    select: (rows) => {
      if (!filters.search) return rows;
      const q = filters.search.toLowerCase();
      return rows.filter(
        (b) =>
          b.reference?.toLowerCase().includes(q) ||
          b.customer_name.toLowerCase().includes(q) ||
          b.origin_postcode.toLowerCase().includes(q)
      );
    },
  });
}
