import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function useWorkerPayslip(payslipId: string) {
  return useQuery({
    queryKey: ["worker-payslip", payslipId],
    queryFn: async () => {
      const response = await apiFetch(`/api/worker/payslips/${payslipId}`);
      return response.json();
    },
    enabled: !!payslipId,
  });
}
