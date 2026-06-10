/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { SERVICE_LABELS_SHORT } from "@/lib/constants";
import type { ServiceType } from "@/types";

export interface ReportData {
  rangeDays: number;
  totalBookings: number;
  completed: number;
  revenue: number;
  byService: { label: string; value: number }[];
  byDay: { label: string; value: number }[];
}

async function loadReports(rangeDays: number): Promise<ReportData> {
  const from = new Date();
  from.setDate(from.getDate() - rangeDays);
  const fromISO = from.toISOString();

  const [{ data: bookings }, { data: paid }] = await Promise.all([
    supabase.from("bookings").select("service_type, status, created_at").gte("created_at", fromISO).limit(5000),
    supabase.from("invoices").select("total").eq("status", "paid").gte("paid_at", fromISO).limit(5000),
  ]);

  const rows = bookings ?? [];
  const completed = rows.filter((b: any) => b.status === "job_completed").length;
  const revenue = (paid ?? []).reduce((a: number, i: any) => a + (i.total ?? 0), 0);

  // By service
  const svc: Record<string, number> = {};
  rows.forEach((b: any) => { svc[b.service_type] = (svc[b.service_type] ?? 0) + 1; });
  const byService = Object.entries(svc)
    .map(([k, v]) => ({ label: SERVICE_LABELS_SHORT[k as ServiceType] ?? k, value: v }))
    .sort((a, b) => b.value - a.value);

  // By day buckets (last up-to-14 days for a readable chart)
  const buckets = Math.min(rangeDays, 14);
  const byDay: { label: string; value: number }[] = [];
  for (let i = buckets - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = rows.filter((b: any) => b.created_at.slice(0, 10) === key).length;
    byDay.push({ label: key.slice(5), value: count });
  }

  return { rangeDays, totalBookings: rows.length, completed, revenue, byService, byDay };
}

export function useReports(rangeDays: number) {
  return useQuery({ queryKey: ["reports", rangeDays], queryFn: () => loadReports(rangeDays) });
}
