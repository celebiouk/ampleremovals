import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface PayRun {
  id: string;
  reference: string;
  period_start: string;
  period_end: string;
  status: "draft" | "finalised" | "paid" | "cancelled";
  created_at: string;
  archived_at?: string | null;
  payslips?: Array<{ count?: number }>;
}

interface PayRunsResponse {
  success: boolean;
  data: PayRun[];
}

export function usePayRuns() {
  return useQuery({
    queryKey: ["payRuns"],
    queryFn: async (): Promise<PayRunsResponse> => {
      const response = await apiFetch("/api/admin/pay-runs", { method: "GET" });
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
