import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/whatsapp-queue — pending (unsent, unexpired) manual WhatsApp
 * messages. Optionally filter to one booking (?bookingId=…) for the booking
 * detail page's card; omitted, returns the global queue everyone processes from.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const bookingId = req.nextUrl.searchParams.get("bookingId");
  const supabase = createAdminClient();
  let query = supabase
    .from("whatsapp_queue")
    .select("id, booking_id, customer_phone, customer_name, title, message, status, created_at, expires_at, bookings(reference)")
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });
  if (bookingId) query = query.eq("booking_id", bookingId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: "Couldn't load the queue." }, { status: 500 });
  return NextResponse.json({ success: true, items: data ?? [] });
}
