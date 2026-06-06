"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Booking, BookingStatus, ServiceType } from "@/types";

export interface BookingRow extends Booking {
  customer_name: string;
  customer_email: string;
  origin_postcode: string;
  destination_postcode: string | null;
}

interface UseBookingsListReturn {
  bookings: BookingRow[];
  total: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  setPage: (p: number) => void;
  refetch: () => void;
}

const PAGE_SIZE = 20;

export function useBookingsList(): UseBookingsListReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const service = (searchParams.get("service") ?? "") as ServiceType | "";
  const status = (searchParams.get("status") ?? "") as BookingStatus | "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("bookings")
        .select(`
          *,
          customers!inner(full_name, email),
          origin_addr:addresses!origin_address_id(postcode),
          dest_addr:addresses!destination_address_id(postcode)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (service) query = query.eq("service_type", service);
      if (status) query = query.eq("status", status);
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");

      const { data, count, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      const rows: BookingRow[] = (data ?? []).map((b: Record<string, unknown>) => {
        const cust = b.customers as { full_name: string; email: string } | null;
        const orig = b.origin_addr as { postcode: string } | null;
        const dest = b.dest_addr as { postcode: string } | null;
        return {
          ...(b as unknown as Booking),
          customer_name: cust?.full_name ?? "—",
          customer_email: cust?.email ?? "—",
          origin_postcode: orig?.postcode ?? "—",
          destination_postcode: dest?.postcode ?? null,
        };
      });

      // Client-side search filter on reference/name/postcode
      const filtered = search
        ? rows.filter(
            (b) =>
              b.reference.toLowerCase().includes(search.toLowerCase()) ||
              b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
              b.origin_postcode.toLowerCase().includes(search.toLowerCase())
          )
        : rows;

      setBookings(filtered);
      setTotal(count ?? 0);
    } catch {
      setError("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  }, [page, service, status, dateFrom, dateTo, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const setPage = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  return { bookings, total, isLoading, error, page, setPage, refetch: fetchBookings };
}
