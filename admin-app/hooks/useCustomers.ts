/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Customer, Booking } from "@/types";

export interface CustomerRow extends Customer {
  booking_count: number;
}

/** Debounce a fast-changing value (e.g. a search box) so we don't hit the DB on every keystroke. */
function useDebouncedValue<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

async function loadCustomers(search: string): Promise<CustomerRow[]> {
  let query = supabase
    .from("customers")
    .select("*, bookings(id)")
    .order("created_at", { ascending: false })
    .limit(500);

  // Search the WHOLE table server-side (name/email/phone), not just the fetched
  // window. Strip characters that would break the PostgREST or() filter.
  const s = search.replace(/[,%()]/g, " ").trim();
  if (s) query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    ...(c as Customer),
    booking_count: Array.isArray(c.bookings) ? c.bookings.length : 0,
  }));
}

export function useCustomers(search: string) {
  const debounced = useDebouncedValue(search);
  return useQuery({
    queryKey: ["customers", debounced],
    queryFn: () => loadCustomers(debounced),
    placeholderData: keepPreviousData,
  });
}

export interface CustomerDetail {
  customer: Customer;
  bookings: Booking[];
}

async function loadCustomerDetail(customerId: string): Promise<CustomerDetail> {
  const [{ data: customer, error }, { data: bookings }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", customerId).single(),
    supabase.from("bookings").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }),
  ]);
  if (error || !customer) throw error ?? new Error("Customer not found");
  return { customer: customer as Customer, bookings: (bookings as Booking[]) ?? [] };
}

export function useCustomerDetail(customerId: string) {
  return useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => loadCustomerDetail(customerId),
    enabled: !!customerId,
  });
}
