import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Payslip {
  id: string;
  worker_id: string;
  worker_type: string;
  gross_earnings: number;
  tips_total: number;
  adjustments_total: number;
  net_pay: number;
  status: "pending" | "paid";
  paid_at?: string;
  payment_method?: string;
}

export interface PayRun {
  id: string;
  reference: string;
  period_start: string;
  period_end: string;
  status: string;
  payslips: Payslip[];
}

export interface Totals {
  gross: number;
  tips: number;
  adjustments: number;
  net: number;
  pending: number;
  paid: number;
}

interface PayRunDetailResponse {
  success: boolean;
  data: {
    run: PayRun;
    totals: Totals;
  };
}

export function usePayRunDetail(runId: string) {
  return useQuery({
    queryKey: ["payRunDetail", runId],
    queryFn: async (): Promise<PayRunDetailResponse> => {
      const response = await apiFetch(`/api/admin/pay-runs/${runId}`, { method: "GET" });
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!runId,
  });
}
