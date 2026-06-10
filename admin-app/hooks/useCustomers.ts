/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Customer, Booking } from "@/types";

export interface CustomerRow extends Customer {
  booking_count: number;
}

async function loadCustomers(): Promise<CustomerRow[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*, bookings(id)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    ...(c as Customer),
    booking_count: Array.isArray(c.bookings) ? c.bookings.length : 0,
  }));
}

export function useCustomers(search: string) {
  return useQuery({
    queryKey: ["customers"],
    queryFn: loadCustomers,
    select: (rows) => {
      if (!search) return rows;
      const q = search.toLowerCase();
      return rows.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    },
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
