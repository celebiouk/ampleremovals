import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { EarningsStatus } from "@/types";

export interface EarningRow {
  id: string;
  driver_id: string;
  booking_id: string;
  pay_percentage: number;
  gross_earnings: number;
  tip_amount: number;
  total_earnings: number;
  status: EarningsStatus;
  paid_at: string | null;
  created_at: string;
  driver?: { first_name: string; last_name: string } | null;
  booking?: { reference: string } | null;
}

export function useEarnings() {
  return useQuery({
    queryKey: ["earnings"],
    queryFn: () => apiFetch<{ success: boolean; earnings: EarningRow[] }>("/api/admin/earnings"),
  });
}
