import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Adjustment {
  id: string;
  type: "bonus" | "deduction" | "advance" | "expense";
  label: string;
  amount: number;
}

export interface PayslipDetail {
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
  payroll_adjustments?: Adjustment[];
}

interface PayslipResponse {
  success: boolean;
  payslip: PayslipDetail;
}

export function usePayslip(payslipId: string) {
  return useQuery({
    queryKey: ["payslip", payslipId],
    queryFn: async (): Promise<PayslipResponse> => {
      const response = await apiFetch(`/api/admin/payslips/${payslipId}`, { method: "GET" });
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!payslipId,
  });
}
