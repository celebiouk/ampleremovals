import { NextResponse } from "next/server";
import { runQuoteFollowupMorning, runDepositFollowupMorning } from "@/lib/followups/engine";

/**
 * GET /api/cron/followup-morning — runs daily at 10am.
 * Morning slot for both drips: email always (days 1-14), SMS only days 1-5.
 * See lib/followups/engine.ts for the day-number/stop-condition logic and
 * lib/followups/content.ts for the copy.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [quote, deposit] = await Promise.all([
      runQuoteFollowupMorning(),
      runDepositFollowupMorning(),
    ]);
    return NextResponse.json({ success: true, quote, deposit });
  } catch (error) {
    console.error("followup-morning cron error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
