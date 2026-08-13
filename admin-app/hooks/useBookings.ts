/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Booking, BookingStatus } from "@/types";

// Finished/dead jobs are hidden from the default "All Status" list — they only
// show when their own status is picked from the filter. Mirrors the web list.
const HIDDEN_FROM_DEFAULT_STATUSES: BookingStatus[] = ["job_completed", "bad_lead", "not_a_good_fit"];

/** Debounce a fast-changing value so search doesn't hit the DB on every keystroke. */
function useDebouncedValue<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

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
  // For a search, resolve matching customers server-side — the name lives on the
  // joined table, so we find their bookings by customer_id.
  const s = search ? search.replace(/[,%()]/g, " ").trim() : "";
  let searchCustIds: string[] = [];
  if (s) {
    const { data: custs } = await supabase
      .from("customers").select("id")
      .or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`)
      .limit(100);
    searchCustIds = (custs ?? []).map((c: any) => c.id as string);
  }

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
  else if (!s) query = query.not("status", "in", `(${HIDDEN_FROM_DEFAULT_STATUSES.join(",")})`);
  if (service) query = query.eq("service_type", service);

  // Search the WHOLE table by reference or matched customer — not just the window.
  if (s) {
    const parts = [`reference.ilike.%${s}%`];
    if (searchCustIds.length) parts.push(`customer_id.in.(${searchCustIds.join(",")})`);
    query = query.or(parts.join(","));
  }

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
  const debounced = useDebouncedValue(filters.search);
  return useQuery({
    queryKey: ["bookings", filters.status, filters.service ?? "", debounced],
    queryFn: () => loadBookings({ search: debounced, status: filters.status, service: filters.service }),
    placeholderData: keepPreviousData,
  });
}
