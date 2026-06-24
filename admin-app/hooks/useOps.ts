import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ── AnyVan jobs ───────────────────────────────────────────────────────────────
export interface AnyVanJob {
  id: string; customer_name: string; phone: string; email: string | null;
  amount: number | null; job_at: string; driver_name: string | null;
  rating: number | null; rating_request_sent: boolean; created_at: string;
}
export function useAnyVanJobs() {
  return useQuery({
    queryKey: ["anyvan-jobs"],
    queryFn: async (): Promise<AnyVanJob[]> => {
      const j = (await (await apiFetch("/api/admin/anyvan-jobs")).json()) as { jobs?: AnyVanJob[] };
      return j.jobs ?? [];
    },
  });
}
export function useAddAnyVanJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { customer_name: string; phone: string; email?: string; amount?: number; job_at: string; driver_id?: string }) =>
      (await apiFetch("/api/admin/anyvan-jobs", { method: "POST", body: JSON.stringify(input) })).json(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["anyvan-jobs"] }),
  });
}

// ── Overdue / items still out ─────────────────────────────────────────────────
export interface OverdueJob {
  id: string; reference: string; move_date: string; days_overdue: number; stage: string;
  customer: { full_name: string; phone: string } | null;
  origin: { postcode?: string; city?: string } | null;
  destination: { postcode?: string; city?: string } | null;
  drivers: string[];
}
export function useOverdue() {
  return useQuery({
    queryKey: ["overdue"],
    queryFn: async (): Promise<OverdueJob[]> => {
      const j = (await (await apiFetch("/api/admin/overdue-deliveries")).json()) as { jobs?: OverdueJob[] };
      return j.jobs ?? [];
    },
  });
}

// ── Approvals (extras / expenses / leave) ─────────────────────────────────────
type ApprovalKind = "job-extras" | "expenses" | "leave-requests";
const KEY: Record<ApprovalKind, string> = { "job-extras": "extras", expenses: "expenses", "leave-requests": "requests" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useApprovalList(kind: ApprovalKind) {
  return useQuery({
    queryKey: ["approvals", kind],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: async (): Promise<any[]> => {
      const j = (await (await apiFetch(`/api/admin/${kind}?status=pending`)).json()) as Record<string, unknown>;
      return (j[KEY[kind]] as unknown[]) ?? [];
    },
  });
}
export function useApprove(kind: ApprovalKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: "approved" | "rejected" }) =>
      (await apiFetch(`/api/admin/${kind}`, { method: "PATCH", body: JSON.stringify(input) })).json(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals", kind] }),
  });
}
