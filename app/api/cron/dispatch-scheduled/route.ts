import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendBookingSummaryEmail } from "@/lib/booking-summary-email";
import { sendReserveMessages } from "@/lib/bookings/quoteDelivery";
import { sendCustomerConfirmationEmail, sendCustomerConfirmationSMS } from "@/lib/notifications";
import type { ScheduledPayload } from "@/lib/bookings/schedule-notify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/dispatch-scheduled — runs every minute. Sends any customer
 * notification whose 60-second delay (see lib/bookings/schedule-notify.ts) has
 * elapsed. Claims each row (sent_at = now()) before sending so two overlapping
 * cron runs can't double-send.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data: due } = await supabase
    .from("scheduled_notifications")
    .select("id, kind, payload")
    .is("sent_at", null)
    .lte("send_after", now)
    .limit(100);

  if (!due?.length) return NextResponse.json({ success: true, dispatched: 0 });

  let dispatched = 0;
  for (const row of due) {
    // Claim it first (only if still unclaimed) so a concurrent run can't resend.
    const { data: claimed } = await supabase
      .from("scheduled_notifications")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    try {
      const payload = row.payload as ScheduledPayload;
      if (payload.kind === "removals_reserve") {
        await Promise.allSettled([
          sendBookingSummaryEmail(payload.summary),
          sendReserveMessages(payload.reserve),
        ]);
      } else if (payload.kind === "generic_confirmation") {
        await Promise.allSettled([
          sendCustomerConfirmationEmail(payload.notif),
          sendCustomerConfirmationSMS(payload.notif),
        ]);
      }
      dispatched++;
    } catch (e) {
      console.error("dispatch-scheduled: send failed for", row.id, e);
    }
  }

  return NextResponse.json({ success: true, dispatched });
}
