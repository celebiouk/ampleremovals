/**
 * POST /api/quote/fixed-price-request — House Clearance / Rubbish Removal
 * "fixed price" path: no instant total (unlike /api/quote/instant-hourly),
 * since a fair fixed price needs to see what's actually being cleared.
 * Creates a real booking (status "inquiry", awaiting an admin-built quote,
 * same as any other lead), queues a WhatsApp message asking for photos (for
 * admin to fire manually — see lib/twilio.ts, WhatsApp is always queue-only),
 * and emails the customer the same "send us photos" ask. The widget then
 * shows the customer WhatsApp/Email buttons to actually send the photos.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateBookingReference } from "@/lib/utils";
import { insertAddress } from "@/lib/bookings/createBooking";
import { sendEmail } from "@/lib/resend";
import { sendWhatsApp } from "@/lib/twilio";
import type { AddressOption } from "@/types";

export const runtime = "nodejs";

interface Body {
  service: "house_clearance";
  itemsDescription: string;
  fullName: string;
  email: string;
  phone: string;
  address: AddressOption;
  moveDate: string; // YYYY-MM-DD
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Body | null;
  if (!body) return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });

  if (!body.itemsDescription?.trim() || body.itemsDescription.trim().length < 5) {
    return NextResponse.json({ success: false, error: "Tell us a bit about what needs clearing" }, { status: 400 });
  }
  if (!body.fullName?.trim() || !body.email?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ success: false, error: "Name, email and phone are required" }, { status: 400 });
  }
  if (!body.address?.postcode?.trim()) {
    return NextResponse.json({ success: false, error: "A postcode is required" }, { status: 400 });
  }
  if (!body.moveDate) {
    return NextResponse.json({ success: false, error: "Pick a date" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .upsert({ full_name: body.fullName.trim(), email: body.email.trim().toLowerCase(), phone: body.phone.trim() }, { onConflict: "email" })
    .select("id")
    .single();
  if (customerError || !customer) {
    return NextResponse.json({ success: false, error: `Couldn't save your details: ${customerError?.message}` }, { status: 500 });
  }

  let originAddressId: string;
  try {
    originAddressId = await insertAddress(supabase, body.address);
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Couldn't save address" }, { status: 500 });
  }

  const reference = generateBookingReference("house_clearance");
  const fullName = body.fullName.trim();
  const firstName = fullName.split(/\s+/)[0] || fullName;
  const email = body.email.trim().toLowerCase();
  const phone = body.phone.trim();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      reference,
      service_type: "house_clearance",
      customer_id: customer.id,
      status: "inquiry",
      origin_address_id: originAddressId,
      move_date: body.moveDate,
      source: "location_page_fixed_price_request",
      description: `Fixed-price quote requested — what needs clearing: ${body.itemsDescription.trim()}`,
    })
    .select("id")
    .single();
  if (bookingError || !booking) {
    return NextResponse.json({ success: false, error: `Couldn't create booking: ${bookingError?.message}` }, { status: 500 });
  }

  await supabase.from("status_history").insert({
    booking_id: booking.id,
    previous_status: null,
    new_status: "inquiry",
    changed_by: "system",
  });
  await supabase.from("activity_log").insert({
    booking_id: booking.id,
    customer_id: customer.id,
    action: "Fixed-price quote requested — awaiting photos",
    metadata: { channel: "location_page_fixed_price_request" },
    performed_by: "system",
  });

  // Queue a WhatsApp asking for photos (admin fires it manually from the
  // business number — see /admin/whatsapp-queue) and email the same ask.
  const whatsappAsk = `Hi ${firstName}, thanks for your clearance request (ref ${reference})! To give you a fair fixed price, could you send a few photos of what needs clearing? Reply here with the photos whenever's convenient.`;
  await sendWhatsApp(phone, whatsappAsk, undefined, { bookingId: booking.id, title: "Fixed-price quote — ask for photos" }).catch((e) => console.warn("fixed-price-request whatsapp queue failed:", e));

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
      <div style="background: #6b21a8; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">One more thing — send us a few photos 📸</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin: 16px 0;">Thanks for your clearance request (ref ${reference}). You told us: <em>"${body.itemsDescription.trim()}"</em></p>
        <p style="font-size: 16px; margin: 16px 0;">To give you a fair, fixed price, we just need a few photos of what needs clearing. Reply to this email with the photos attached, or WhatsApp them to <strong>0333 577 2070</strong> — whichever's easier.</p>
        <p style="font-size: 16px; margin: 16px 0;">Once we've seen them, we'll send your fixed price quote.</p>
        <p style="font-size: 15px; margin-top: 24px;">Any questions? Just call us on 0333 577 2070.<br><br>Daniel<br>Ample Removals</p>
        <p style="font-size: 13px; color: #94a3b8;">Ref: ${reference}</p>
      </div>
    </div>`;
  await sendEmail({ to: email, subject: `Send us a few photos for your fixed price — ${reference}`, html: emailHtml }).catch((e) => console.warn("fixed-price-request email failed:", e));

  return NextResponse.json({ success: true, bookingId: booking.id, reference });
}
