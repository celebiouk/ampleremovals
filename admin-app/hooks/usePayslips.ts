import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function usePayslips() {
  return useQuery({
    queryKey: ["worker-payslips"],
    queryFn: async () => {
      const response = await apiFetch("/api/worker/payslips");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
