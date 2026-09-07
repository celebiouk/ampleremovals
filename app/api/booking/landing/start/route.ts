import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { generateBookingReference } from "@/lib/utils";
import { generateQuoteConfirmToken } from "@/lib/tokens";
import { ukPhoneSchema } from "@/lib/schemas/booking";
import { deriveSource } from "@/lib/attribution";
import { logError } from "@/lib/log-error";

export const runtime = "nodejs";

/**
 * POST /api/booking/landing/start — save the customer as an ENQUIRY the moment
 * they've given their name/phone/email on the ad landing page, so an abandoned
 * form is still captured as a lead. Completing the form later (see
 * /api/booking/landing) fills in the rest and flips it to "quote sent".
 */
const StartSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: ukPhoneSchema,
});

export async function POST(req: NextRequest) {
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = StartSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Please check your details." }, { status: 400 });
  const { fullName, email, phone } = parsed.data;
  const attribution = (raw as { attribution?: Record<string, string> } | null)?.attribution ?? null;

  try {
    const supabase = createServiceClient();

    // Customer (upsert by email).
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .upsert({ full_name: fullName, email, phone }, { onConflict: "email" })
      .select("id")
      .single();
    if (custErr || !customer) throw new Error(custErr?.message ?? "customer upsert failed");

    // Partial enquiry booking — core columns only.
    const reference = generateBookingReference("removals");
    const source = attribution ? deriveSource(attribution) : "facebook_ad";
    const { data: booking, error: bookErr } = await supabase
      .from("bookings")
      .insert({ reference, service_type: "removals", customer_id: customer.id, status: "inquiry", source })
      .select("id")
      .single();
    if (bookErr || !booking) throw new Error(bookErr?.message ?? "booking insert failed");
    const bookingId = booking.id as string;

    // Mark partial + audit (best-effort).
    try { await supabase.from("bookings").update({ is_partial_lead: true }).eq("id", bookingId); } catch { /* column may be un-migrated */ }
    await Promise.allSettled([
      supabase.from("status_history").insert({ booking_id: bookingId, previous_status: null, new_status: "inquiry", changed_by: "customer" }),
      supabase.from("activity_log").insert({
        booking_id: bookingId, customer_id: customer.id, action: "Enquiry started (ad landing page)",
        metadata: { reference, source }, performed_by: "customer",
      }),
    ]);

    const quoteToken = generateQuoteConfirmToken(bookingId);
    return NextResponse.json({ success: true, bookingId, quoteToken, reference });
  } catch (err) {
    await logError({ message: `landing enquiry start failed: ${err instanceof Error ? err.message : "unknown"}`, metadata: {} });
    return NextResponse.json({ success: false, error: "Couldn't save your enquiry." }, { status: 500 });
  }
}
