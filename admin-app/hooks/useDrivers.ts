/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Driver } from "@/types";

export interface DriverRow extends Driver {
  job_count: number;
  earnings_owed: number;
}

export interface DriverStats {
  total: number;
  active: number;
  inactive: number;
  jobsThisWeek: number;
}

/** A pending self-registered driver: inactive with no pay % set yet. */
export function isPending(d: { status: string; default_pay_percentage: number }): boolean {
  return d.status === "inactive" && Number(d.default_pay_percentage) === 0;
}

export function useDrivers() {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: async (): Promise<{ success: boolean; drivers: DriverRow[]; stats: DriverStats }> =>
      (await apiFetch("/api/admin/drivers")).json(),
  });
}

export interface DriverDetail extends Driver {
  job_count: number;
  earnings_summary: { total: number; pending: number; approved: number; paid: number };
}

export function useDriverDetail(driverId: string) {
  return useQuery({
    queryKey: ["driver", driverId],
    queryFn: async (): Promise<{ success: boolean; driver: DriverDetail }> =>
      (await apiFetch(`/api/admin/drivers/${driverId}`)).json(),
    enabled: !!driverId,
  });
}

export interface DriverDocuments {
  "profile-photo": string | null;
  "licence-front": string | null;
  "licence-back": string | null;
}

export function useDriverDocuments(driverId: string) {
  return useQuery({
    queryKey: ["driver-docs", driverId],
    queryFn: async (): Promise<{ success: boolean; documents: DriverDocuments }> =>
      (await apiFetch(`/api/admin/drivers/${driverId}/documents`)).json(),
    enabled: !!driverId,
  });
}
