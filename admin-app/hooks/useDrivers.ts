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
    queryFn: () =>
      apiFetch<{ success: boolean; drivers: DriverRow[]; stats: DriverStats }>("/api/admin/drivers"),
  });
}

export interface DriverDetail extends Driver {
  job_count: number;
  earnings_summary: { total: number; pending: number; approved: number; paid: number };
}

export function useDriverDetail(driverId: string) {
  return useQuery({
    queryKey: ["driver", driverId],
    queryFn: () => apiFetch<{ success: boolean; driver: DriverDetail }>(`/api/admin/drivers/${driverId}`),
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
    queryFn: () =>
      apiFetch<{ success: boolean; documents: DriverDocuments }>(`/api/admin/drivers/${driverId}/documents`),
    enabled: !!driverId,
  });
}
