import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { Job, ClockStatus, DriverNotification } from "@/lib/types";

type Scope = "today" | "upcoming" | "week" | "completed";

/** Jobs list for a scope, via the server route (service-role, traffic-safe). */
export function useJobs(scope: Scope) {
  return useQuery({
    queryKey: ["jobs", scope],
    queryFn: async (): Promise<Job[]> => {
      const res = await apiFetch(`/api/drivers/jobs?scope=${scope}`);
      const json = (await res.json()) as { jobs: Job[] };
      return json.jobs ?? [];
    },
  });
}

/** A single job, REDACTED server-side to what the driver may see at this stage
 *  (phone gated to 24h before, email never, completed jobs reduced to postcodes). */
export function useJob(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["job", bookingId],
    enabled: !!bookingId,
    queryFn: async (): Promise<Job> => {
      const res = await apiFetch(`/api/drivers/jobs/${bookingId}`);
      const json = (await res.json()) as { success: boolean; job?: Job; error?: string };
      if (!json.success || !json.job) throw new Error(json.error || "Failed to load job");
      return json.job;
    },
  });
}

/** Accept or decline an assigned job. Decline requires a reason. */
export function useRespondToJob(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { action: "accept" | "decline"; reason?: string }) => {
      const res = await apiFetch(`/api/drivers/jobs/${bookingId}/respond`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job", bookingId] });
    },
  });
}

export interface JobExtras {
  coDrivers: { name: string; isLead: boolean }[];
  earning: {
    total_earnings: number; gross_earnings: number; tip_amount: number;
    pay_percentage: number; status: string;
  } | null;
}

export function useJobExtras(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["job-extras", bookingId],
    enabled: !!bookingId,
    queryFn: async (): Promise<JobExtras> => {
      const res = await apiFetch(`/api/drivers/jobs/${bookingId}/extras`);
      const json = (await res.json()) as { coDrivers?: JobExtras["coDrivers"]; earning?: JobExtras["earning"] };
      return { coDrivers: json.coDrivers ?? [], earning: json.earning ?? null };
    },
  });
}

export function useClock() {
  return useQuery({
    queryKey: ["clock"],
    queryFn: async (): Promise<ClockStatus> => {
      const res = await apiFetch(`/api/drivers/time`);
      const json = (await res.json()) as {
        entries: { entry_type: string; at: string }[];
        status: { clockedIn: boolean; onBreak: boolean };
      };
      const entries = json.entries ?? [];
      const lastClockIn = [...entries].reverse().find((e) => e.entry_type === "clock_in");
      return {
        clocked_in: json.status?.clockedIn ?? false,
        on_break: json.status?.onBreak ?? false,
        last_clock_in: lastClockIn?.at ?? null,
        entries_today: entries,
      };
    },
    refetchInterval: 60_000,
  });
}

export function useClockAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action: "clock_in" | "clock_out" | "break_start" | "break_end") => {
      const res = await apiFetch(`/api/drivers/time`, { method: "POST", body: JSON.stringify({ entry_type: action }) });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clock"] }),
  });
}

export interface DriverRating {
  bookingId: string;
  reference: string;
  serviceType: string;
  moveDate: string | null;
  rating: number;
  feedback: string | null;
  completedAt: string | null;
  pickupOutward: string | null;
  destinationOutward: string | null;
}
export interface DriverRatingsResult {
  average: number | null;
  count: number;
  ratings: DriverRating[];
}

/** Customer ratings + comments for the driver's completed jobs. */
export function useDriverRatings() {
  return useQuery({
    queryKey: ["driver-ratings"],
    queryFn: async (): Promise<DriverRatingsResult> => {
      const res = await apiFetch(`/api/drivers/ratings`);
      const json = (await res.json()) as DriverRatingsResult;
      return { average: json.average ?? null, count: json.count ?? 0, ratings: json.ratings ?? [] };
    },
  });
}

export function useDriverNotifications() {
  return useQuery({
    queryKey: ["driver-notifications"],
    queryFn: async (): Promise<DriverNotification[]> => {
      const res = await apiFetch(`/api/drivers/notifications`);
      const json = (await res.json()) as { notifications: DriverNotification[] };
      return json.notifications ?? [];
    },
  });
}

export interface DriverProfile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_photo_url?: string | null;
  vehicle_registration?: string | null;
  vehicle_make_model?: string | null;
  license_number?: string | null;
  license_expiry?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  created_at?: string | null;
}

export function useDriverProfile() {
  const driverId = useAuthStore((s) => s.driverId);
  return useQuery({
    queryKey: ["driver-profile", driverId],
    enabled: !!driverId,
    queryFn: async (): Promise<DriverProfile> => {
      const { data, error } = await supabase.from("drivers").select("*").eq("id", driverId).single();
      if (error) throw new Error(error.message);
      return data as DriverProfile;
    },
  });
}

export interface DriverStats {
  jobsThisWeek: number;
  jobsThisMonth: number;
  earningsThisMonth: number;
  tipsThisMonth: number;
}

export function useDriverStats() {
  const driverId = useAuthStore((s) => s.driverId);
  return useQuery({
    queryKey: ["driver-stats", driverId],
    enabled: !!driverId,
    queryFn: async (): Promise<DriverStats> => {
      const now = new Date();
      const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [{ count: monthJobs }, { data: weekAssign }, { data: earnings }] = await Promise.all([
        supabase.from("booking_driver_assignments").select("*", { count: "exact", head: true }).eq("driver_id", driverId),
        supabase.from("booking_driver_assignments")
          .select("id, booking:bookings(move_date)").eq("driver_id", driverId),
        supabase.from("driver_earnings").select("total_earnings, tip_amount").eq("driver_id", driverId).gte("created_at", startOfMonth.toISOString()),
      ]);

      // Compare as YYYY-MM-DD strings (device is in the UK) to avoid the
      // UTC-midnight shift you get from new Date("YYYY-MM-DD").
      const pad = (n: number) => String(n).padStart(2, "0");
      const startKey = `${startOfWeek.getFullYear()}-${pad(startOfWeek.getMonth() + 1)}-${pad(startOfWeek.getDate())}`;
      const jobsThisWeek = (weekAssign ?? []).filter((a) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const md = (a as any).booking?.move_date;
        return md && String(md).slice(0, 10) >= startKey;
      }).length;

      const earningsThisMonth = (earnings ?? []).reduce((s, e) => s + (e.total_earnings || 0), 0);
      const tipsThisMonth = (earnings ?? []).reduce((s, e) => s + (e.tip_amount || 0), 0);
      return { jobsThisWeek, jobsThisMonth: monthJobs ?? 0, earningsThisMonth, tipsThisMonth };
    },
  });
}
