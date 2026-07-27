import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendRatingRequest } from "@/lib/rating-request";

/**
 * GET /api/cron/send-surveys — runs daily.
 * Nudges customers who completed a move but haven't left a rating yet: one review
 * EMAIL per day for up to 7 days after completion, stopping the moment they rate
 * (survey_rating set) or after 7 sends. The initial all-channel request goes out
 * the instant the driver taps Complete; this is the daily follow-up.
 *
 * (Previously keyed on job_completed_at — a column nothing ever set — so it did
 *  nothing. Now driven off completed_at + survey_rating.)
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Completed in the last 7 days, not yet rated, fewer than 7 nudges so far.
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("status", "job_completed")
    .is("survey_rating", null)
    .not("completed_at", "is", null)
    .gte("completed_at", sevenDaysAgo)
    .lt("survey_reminder_count", 7)
    .limit(500);

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 });
  }

  // Email-only reminders. sendRatingRequest itself enforces ≤1/day, the 7 cap and
  // the "already reviewed" stop, so this is safe to run daily.
  await Promise.allSettled(
    (bookings ?? []).map((b) => sendRatingRequest(supabase, b.id, { channel: "email" }))
  );

  return NextResponse.json({ success: true, considered: bookings?.length ?? 0 });
}
