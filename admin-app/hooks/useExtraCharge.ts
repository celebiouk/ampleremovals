import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ExtraChargeRates, ExtraType } from "@/lib/extra-pricing";

/** Admin-set £ rates for auto-pricing an on-site extra — see Settings > Company on the web admin. */
export function useExtraRates() {
  return useQuery({
    queryKey: ["extra-rates"],
    queryFn: async (): Promise<ExtraChargeRates> => {
      const j = (await (await apiFetch("/api/admin/extra-rates")).json()) as { rates: ExtraChargeRates };
      return j.rates;
    },
    staleTime: 5 * 60_000,
  });
}

export interface AddExtraChargeInput {
  extraType: ExtraType;
  itemKey?: string; itemLabel?: string; quantity?: number;
  flights?: number; distanceMeters?: number;
  description?: string;
  amount: number;
}

/** Admin adding one IS the approval — invoiced + sent to the customer immediately. */
export function useAddExtraCharge(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddExtraChargeInput) => {
      const res = await apiFetch(`/api/admin/bookings/${bookingId}/extra-charge`, { method: "POST", body: JSON.stringify(input) });
      return res.json() as Promise<{ success: boolean; invoiced?: boolean; error?: string }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking", bookingId] }),
  });
}
