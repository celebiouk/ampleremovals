/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Invoice } from "@/types";

export interface InvoiceRow extends Invoice {
  customer_name: string;
  booking_reference: string;
}

async function loadInvoices(): Promise<InvoiceRow[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, customers(full_name), bookings(reference)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []).map((i: any) => ({
    ...(i as Invoice),
    customer_name: i.customers?.full_name ?? "—",
    booking_reference: i.bookings?.reference ?? "—",
  }));
}

export function useInvoices(status: string) {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: loadInvoices,
    select: (rows) => (status ? rows.filter((r) => r.status === status) : rows),
  });
}

export function useInvoiceDetail(invoiceId: string) {
  return useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: async (): Promise<InvoiceRow> => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(full_name, email), bookings(reference)")
        .eq("id", invoiceId)
        .single();
      if (error || !data) throw error ?? new Error("Invoice not found");
      return {
        ...(data as any as Invoice),
        customer_name: (data as any).customers?.full_name ?? "—",
        booking_reference: (data as any).bookings?.reference ?? "—",
      };
    },
    enabled: !!invoiceId,
  });
}
