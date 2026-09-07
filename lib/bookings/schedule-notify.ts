/**
 * Delays the CUSTOMER-facing "your quote/confirmation" messages by 60 seconds
 * after a self-serve booking submit, so the customer has time to read the rest
 * of the booking screen before an email/SMS lands — instead of it arriving the
 * instant they hit submit. The admin new-booking alert is NOT delayed (still
 * fires immediately via the normal Promise.allSettled in the caller).
 *
 * A row here is picked up by /api/cron/dispatch-scheduled (runs every minute)
 * and dispatched via sendBookingSummaryEmail + sendReserveMessages /
 * sendCustomerConfirmationEmail + sendCustomerConfirmationSMS. Best-effort: if
 * scheduling fails for any reason we send immediately instead, so a booking
 * never loses its confirmation.
 */
import { createAdminClient } from "@/lib/supabase/server";
import type { BookingSummaryInput } from "@/lib/booking-summary-email";
import type { ReserveMessageParams } from "@/lib/bookings/quoteDelivery";
import type { NotificationPayload } from "@/lib/notifications";

const DELAY_SECONDS = 60;

export type ScheduledPayload =
  | { kind: "removals_reserve"; summary: BookingSummaryInput; reserve: ReserveMessageParams }
  | { kind: "generic_confirmation"; notif: NotificationPayload };

/** Queue a customer notification for ~60s from now. Returns true if scheduled. */
export async function scheduleCustomerNotification(bookingId: string, payload: ScheduledPayload): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const sendAfter = new Date(Date.now() + DELAY_SECONDS * 1000).toISOString();
    const { error } = await supabase.from("scheduled_notifications").insert({
      kind: payload.kind,
      booking_id: bookingId,
      payload,
      send_after: sendAfter,
    });
    return !error;
  } catch {
    return false;
  }
}
