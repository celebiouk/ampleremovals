/**
 * GET /api/cron/anyvan-rating-requests — daily. Sends the rating request for any
 * AnyVan job whose delivery was ≥ 48h ago and hasn't been asked yet.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAnyVanRatingRequest } from "@/lib/anyvan-rating";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: due } = await supabase
      .from("anyvan_jobs")
      .select("id")
      .lte("job_at", cutoff)
      .eq("rating_request_sent", false)
      .limit(200);

    let sent = 0;
    for (const j of due ?? []) {
      await sendAnyVanRatingRequest(supabase, j.id);
      sent++;
    }
    return NextResponse.json({ success: true, sent });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
