import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { twilioClient, twilioFrom } from "@/lib/twilio";
import { normaliseUKPhone } from "@/lib/utils";
import { logError } from "@/lib/log-error";

const schema = z.object({
  bookingId: z.string().uuid(),
  message: z.string().min(1).max(160),
});

export async function POST(request: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });

  const { bookingId, message } = parsed.data;
  const supabase = createAdminClient();

  try {
    const { data: booking } = await supabase
      .from("bookings").select("reference, customers(full_name, phone)").eq("id", bookingId).single();

    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

    const customer = (Array.isArray(booking.customers) ? booking.customers[0] : booking.customers) as { full_name: string; phone: string } | null;
    if (!customer?.phone) return NextResponse.json({ success: false, error: "No customer phone" }, { status: 400 });

    if (!twilioClient) {
      await logError({ message: "admin send-sms skipped: Twilio not configured", level: "info", metadata: { bookingId } });
      return NextResponse.json({ success: false, error: "SMS not configured" }, { status: 503 });
    }

    await twilioClient.messages.create({
      from: twilioFrom,
      to: normaliseUKPhone(customer.phone),
      body: message,
    });

    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Custom SMS sent to customer",
      metadata: { sentAt: new Date().toISOString() },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    await logError({ message: `admin send-sms failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { bookingId } });
    return NextResponse.json({ success: false, error: "Failed to send SMS" }, { status: 500 });
  }
}
