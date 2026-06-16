import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log-error";
import { ALL_STATUSES } from "@/lib/constants";
import { sendJobConfirmation } from "@/lib/job-confirmation";
import type { BookingStatus } from "@/types";

const schema = z.object({
  bookingIds: z.array(z.string().uuid()).min(1),
  status: z.enum(ALL_STATUSES as [BookingStatus, ...BookingStatus[]]),
});

export async function PATCH(request: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });

  const { bookingIds, status: newStatus } = parsed.data;
  const supabase = createAdminClient();

  try {
    const { data: bookings } = await supabase
      .from("bookings").select("id, status").in("id", bookingIds);

    await supabase.from("bookings").update({ status: newStatus }).in("id", bookingIds);

    const historyRows = (bookings ?? []).map((b: { id: string; status: BookingStatus }) => ({
      booking_id: b.id,
      previous_status: b.status,
      new_status: newStatus,
      changed_by: "admin",
    }));
    if (historyRows.length) await supabase.from("status_history").insert(historyRows);

    const logRows = (bookings ?? []).map((b: { id: string; status: BookingStatus }) => ({
      booking_id: b.id,
      action: `Status changed from ${b.status} to ${newStatus}`,
      metadata: { previous: b.status, new: newStatus, bulk: true },
      performed_by: "admin",
    }));
    if (logRows.length) await supabase.from("activity_log").insert(logRows);

    // Reassure customers whose jobs were newly confirmed in this bulk change.
    if (newStatus === "deposit_paid_job_confirmed") {
      const newlyConfirmed = (bookings ?? []).filter((b: { id: string; status: BookingStatus }) => b.status !== "deposit_paid_job_confirmed");
      await Promise.allSettled(newlyConfirmed.map((b: { id: string }) => sendJobConfirmation(supabase, b.id)));
    }

    return NextResponse.json({ success: true, updated: bookingIds.length });
  } catch (err) {
    await logError({ message: `bulk status update failed: ${err instanceof Error ? err.message : String(err)}` });
    return NextResponse.json({ success: false, error: "Failed to update bookings" }, { status: 500 });
  }
}
