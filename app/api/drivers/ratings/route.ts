/**
 * GET /api/drivers/ratings — the signed-in driver's customer ratings.
 *
 * A booking's post-move survey (survey_rating 1–5 + survey_feedback) is the
 * rating for the driver(s) who did that job. Returns the per-job ratings plus
 * an average + count so the driver can see how they're doing.
 */

import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { outwardCode } from "@/lib/driver-job-view";

export async function GET() {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    const { data: assigns } = await supabase
      .from("booking_driver_assignments")
      .select("booking_id")
      .eq("driver_id", auth.driver.id);
    const ids = (assigns ?? []).map((a) => a.booking_id);
    if (ids.length === 0) return NextResponse.json({ success: true, average: null, count: 0, ratings: [] });

    const { data, error } = await supabase
      .from("bookings")
      .select("id, reference, service_type, move_date, survey_rating, survey_feedback, survey_completed_at, origin:addresses!origin_address_id(postcode), destination:addresses!destination_address_id(postcode)")
      .in("id", ids)
      .not("survey_rating", "is", null)
      .order("survey_completed_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Completed jobs are redacted: no customer name — only outward postcodes + the rating.
    const ratings = (data ?? []).map((b) => {
      const origin = Array.isArray(b.origin) ? b.origin[0] : b.origin;
      const destination = Array.isArray(b.destination) ? b.destination[0] : b.destination;
      return {
        bookingId: b.id,
        reference: b.reference,
        serviceType: b.service_type,
        moveDate: b.move_date,
        rating: b.survey_rating as number,
        feedback: (b.survey_feedback as string | null) ?? null,
        completedAt: b.survey_completed_at,
        pickupOutward: outwardCode((origin as { postcode?: string } | null)?.postcode),
        destinationOutward: outwardCode((destination as { postcode?: string } | null)?.postcode),
      };
    });

    const count = ratings.length;
    const average = count > 0 ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : null;

    return NextResponse.json({ success: true, average, count, ratings });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
