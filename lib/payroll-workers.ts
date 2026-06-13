/**
 * Resolve human-readable worker names for payslips.
 *
 * Payslips reference a worker polymorphically (`worker_type` + `worker_id`),
 * so there's no single SQL join. This batches a lookup per worker type and
 * attaches a `worker_name` to each row, falling back to a "Driver ab12cd34"
 * style label when a name can't be resolved.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

type WorkerLike = { worker_id: string; worker_type: string };

function fallbackLabel(workerType: string, workerId: string): string {
  const prefix = workerType === "driver" ? "Driver" : "Cleaner";
  return `${prefix} ${workerId.slice(0, 8)}`;
}

export async function attachWorkerNames<T extends WorkerLike>(
  supabase: SupabaseClient,
  rows: T[]
): Promise<(T & { worker_name: string })[]> {
  const names = new Map<string, string>();

  const driverIds = [
    ...new Set(rows.filter((r) => r.worker_type === "driver").map((r) => r.worker_id)),
  ];
  const cleanerIds = [
    ...new Set(rows.filter((r) => r.worker_type === "cleaner").map((r) => r.worker_id)),
  ];

  if (driverIds.length > 0) {
    const { data } = await supabase
      .from("drivers")
      .select("id, first_name, last_name")
      .in("id", driverIds);
    (data ?? []).forEach((d: { id: string; first_name?: string; last_name?: string }) => {
      const name = [d.first_name, d.last_name].filter(Boolean).join(" ").trim();
      if (name) names.set(d.id, name);
    });
  }

  if (cleanerIds.length > 0) {
    // Cleaners are still being rolled out — resolve best-effort so a missing
    // table/column never breaks payroll.
    try {
      const { data } = await supabase
        .from("cleaners")
        .select("id, first_name, last_name")
        .in("id", cleanerIds);
      (data ?? []).forEach((c: { id: string; first_name?: string; last_name?: string }) => {
        const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
        if (name) names.set(c.id, name);
      });
    } catch {
      // ignore — generic label below
    }
  }

  return rows.map((r) => ({
    ...r,
    worker_name: names.get(r.worker_id) || fallbackLabel(r.worker_type, r.worker_id),
  }));
}
