/**
 * Driver job acceptance — token-gated, NO login.
 *   GET  ?bookingId&driverId&token  → job summary + current acceptance status
 *   POST { bookingId, driverId, token, action: "accept" | "decline" }
 *
 * Linked from the assignment email so a driver can respond in one tap.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyAssignmentToken } from "@/lib/tokens";
import { sendAdminPush } from "@/lib/push-dispatch";
import { formatDate } from "@/lib/utils";
import { SERVICE_LABELS } from "@/lib/constants";
import type { ServiceType } from "@/types";

async function loadContext(supabase: ReturnType<typeof createAdminClient>, bookingId: string, driverId: string) {
  const { data: booking } = await supabase
    .from("bookings")
    .select(`reference, service_type, move_date, is_flexible_date, flexible_date_from, flexible_date_to,
      customer:customers(full_name),
      origin:addresses!origin_address_id(line_1, city, postcode),
      destination:addresses!destination_address_id(postcode)`)
    .eq("id", bookingId).single();
  const { data: assignment } = await supabase
    .from("booking_driver_assignments")
    .select("id, acceptance_status").eq("booking_id", bookingId).eq("driver_id", driverId).maybeSingle();
  return { booking, assignment };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bookingId = url.searchParams.get("bookingId") ?? "";
  const driverId = url.searchParams.get("driverId") ?? "";
  const token = url.searchParams.get("token") ?? "";
  if (!verifyAssignmentToken(bookingId, driverId, token)) {
    return NextResponse.json({ success: false, error: "This link is invalid or has expired." }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { booking, assignment } = await loadContext(supabase, bookingId, driverId);
  if (!booking || !assignment) return NextResponse.json({ success: false, error: "Job not found." }, { status: 404 });

  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  const o = Array.isArray(booking.origin) ? booking.origin[0] : booking.origin;
  const d = Array.isArray(booking.destination) ? booking.destination[0] : booking.destination;
  const dateStr = booking.is_flexible_date && booking.flexible_date_from && booking.flexible_date_to
    ? `Flexible: ${formatDate(booking.flexible_date_from)} – ${formatDate(booking.flexible_date_to)}`
    : booking.move_date ? formatDate(booking.move_date) : "TBC";

  return NextResponse.json({
    success: true,
    status: assignment.acceptance_status ?? "pending",
    job: {
      reference: booking.reference,
      service: SERVICE_LABELS[booking.service_type as ServiceType] ?? booking.service_type,
      date: dateStr,
      customer: customer?.full_name ?? "Customer",
      pickup: o ? [o.line_1, o.city, o.postcode].filter(Boolean).join(", ") : "—",
      dropoff: d?.postcode ?? null,
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { bookingId?: string; driverId?: string; token?: string; action?: string } | null;
  const bookingId = body?.bookingId ?? "";
  const driverId = body?.driverId ?? "";
  const token = body?.token ?? "";
  const action = body?.action;
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  }
  if (!verifyAssignmentToken(bookingId, driverId, token)) {
    return NextResponse.json({ success: false, error: "This link is invalid or has expired." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: assignment } = await supabase
    .from("booking_driver_assignments")
    .select("id").eq("booking_id", bookingId).eq("driver_id", driverId).maybeSingle();
  if (!assignment) return NextResponse.json({ success: false, error: "Assignment not found." }, { status: 404 });

  const status = action === "accept" ? "accepted" : "declined";
  const { error } = await supabase
    .from("booking_driver_assignments")
    .update({ acceptance_status: status, responded_at: new Date().toISOString() })
    .eq("id", assignment.id);
  if (error) return NextResponse.json({ success: false, error: "Couldn't save your response." }, { status: 500 });

  // Notify admin + log.
  const { data: driver } = await supabase.from("drivers").select("first_name, last_name, preferred_name").eq("id", driverId).single();
  const { data: booking } = await supabase.from("bookings").select("reference").eq("id", bookingId).single();
  const name = driver?.preferred_name || [driver?.first_name, driver?.last_name].filter(Boolean).join(" ") || "Driver";
  const ref = booking?.reference ?? "";
  await supabase.from("activity_log").insert({
    booking_id: bookingId,
    action: `Driver ${status} the job: ${name}`,
    metadata: { driverId, status }, performed_by: "driver",
  });
  try {
    await supabase.from("notifications").insert({
      type: "driver_response",
      title: action === "accept" ? "Driver accepted job" : "⚠️ Driver declined job",
      description: `${name} ${status} job ${ref}.`,
      booking_id: bookingId,
    });
  } catch { /* non-critical */ }
  await sendAdminPush({
    title: action === "accept" ? "✅ Driver accepted" : "⚠️ Driver declined",
    body: `${name} ${status} job ${ref}${action === "decline" ? " — reassign needed" : ""}.`,
    data: { bookingId },
  }).catch(() => {});

  return NextResponse.json({ success: true, status });
}
