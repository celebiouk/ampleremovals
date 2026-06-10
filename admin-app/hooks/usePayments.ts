/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PaymentRow {
  id: string;
  amount: number;
  payment_method: string | null;
  paid_at: string;
  customer_name: string;
  invoice_number: string;
}

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async (): Promise<PaymentRow[]> => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, payment_method, paid_at, customers(full_name), invoices(invoice_number)")
        .order("paid_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        payment_method: p.payment_method,
        paid_at: p.paid_at,
        customer_name: p.customers?.full_name ?? "—",
        invoice_number: p.invoices?.invoice_number ?? "—",
      }));
    },
  });
}
