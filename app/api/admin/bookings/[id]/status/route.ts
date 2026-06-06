import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log-error";
import { ALL_STATUSES } from "@/lib/constants";
import type { BookingStatus } from "@/types";

const schema = z.object({
  status: z.enum(ALL_STATUSES as [BookingStatus, ...BookingStatus[]]),
});

async function getAuthUser(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });

  const newStatus = parsed.data.status;
  const bookingId = params.id;
  const supabase = createAdminClient();

  try {
    const { data: current, error: fetchErr } = await supabase
      .from("bookings").select("status").eq("id", bookingId).single();
    if (fetchErr || !current) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

    const previousStatus = current.status as BookingStatus;

    await supabase.from("bookings").update({ status: newStatus }).eq("id", bookingId);

    await supabase.from("status_history").insert({
      booking_id: bookingId,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by: "admin",
    });

    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `Status changed from ${previousStatus} to ${newStatus}`,
      metadata: { previous: previousStatus, new: newStatus },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true, newStatus });
  } catch (err) {
    await logError({ message: `status update failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { bookingId } });
    return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 });
  }
}
