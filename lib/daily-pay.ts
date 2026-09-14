/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The daily-pay cap: a porter or AnyVan-job driver is never paid more than
 * one day's rate no matter how many jobs/approved requests land on the same
 * calendar day — admin's explicit "pay extra" is the only way past it.
 *
 * This only computes the DEFAULT amount to prefill when admin hasn't typed a
 * number themselves — an explicit admin-entered amount is always respected
 * as-is (they might genuinely want to override the cap without using "pay
 * extra"). Applied at assignment/approval time, not silently at payroll time,
 * so the cap is visible to whoever's setting the pay.
 */
import { createAdminClient } from "@/lib/supabase/server";

const DEFAULT_PORTER_DAY_RATE = 100;
const DEFAULT_ANYVAN_DRIVER_DAY_RATE = 150;

export interface DailyPayStatus {
  dayRate: number;
  committedToday: number; // sum of gross_earnings + pay_extra_amount already recorded for this worker on this date
  remaining: number; // max(0, dayRate - committedToday) — the sensible default for a NEW entry
}

/**
 * How much of `driverId`'s day-rate for `workDate` (YYYY-MM-DD) is already
 * committed, and what a new assignment/request should default to.
 */
export async function dailyPayStatus(
  driverId: string,
  workDate: string,
  role: "driver" | "porter",
  isAnyvan: boolean
): Promise<DailyPayStatus> {
  const dayRate = role === "porter" ? DEFAULT_PORTER_DAY_RATE : isAnyvan ? DEFAULT_ANYVAN_DRIVER_DAY_RATE : 0;
  if (dayRate === 0) return { dayRate: 0, committedToday: 0, remaining: 0 }; // regular driver job — no cap concept

  const supabase = createAdminClient();
  // Every driver_earnings row for this driver whose booking's move_date (or,
  // for a manual-request-derived booking, the same move_date) falls on this day.
  const { data: rows } = await supabase
    .from("driver_earnings")
    .select("gross_earnings, pay_extra_amount, bookings!inner(move_date)")
    .eq("driver_id", driverId)
    .eq("bookings.move_date", workDate);

  const committedToday = (rows ?? []).reduce(
    (sum: number, r: any) => sum + Number(r.gross_earnings || 0) + Number(r.pay_extra_amount || 0),
    0
  );

  return { dayRate, committedToday, remaining: Math.max(0, dayRate - committedToday) };
}
