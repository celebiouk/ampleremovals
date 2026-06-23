import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { twilioClient, twilioFrom, normaliseSmsBody } from "@/lib/twilio";
import { normaliseUKPhone } from "@/lib/utils";
import { logError } from "@/lib/log-error";

const schema = z.object({
  bookingId: z.string().uuid(),
  subject: z.string().min(1).max(200),
  message: z.string().min(5).max(5000),
  smsMessage: z.string().max(160).optional(), // short SMS version
});

export async function POST(request: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });

  const { bookingId, subject, message, smsMessage } = parsed.data;
  const supabase = createAdminClient();

  try {
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, customers(full_name, email, phone)")
      .eq("id", bookingId)
      .single();

    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

    const customer = (Array.isArray(booking.customers) ? booking.customers[0] : booking.customers) as { full_name: string; email: string; phone: string } | null;
    if (!customer?.email) return NextResponse.json({ success: false, error: "No customer email" }, { status: 400 });

    const { data: settings } = await supabase.from("settings").select("company_name, company_phone").eq("id", 1).single();
    const companyName = settings?.company_name ?? "Ample Removals";
    const companyPhone = settings?.company_phone ?? "0333 577 2070";

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#6b21a8;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">${companyName}</h1>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:28px;">
        <p style="color:#1e293b;margin-bottom:4px;">Hi ${customer.full_name},</p>
        <div style="color:#475569;line-height:1.7;white-space:pre-wrap;margin-top:12px;">${message}</div>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#94a3b8;font-size:12px;">Ref: ${booking.reference} | ${companyName} — ${companyPhone}</p>
      </div>
    </body></html>`;

    const { error: sendErr } = await resend.emails.send({
      from: resendFrom,
      to: customer.email,
      subject,
      html,
    });

    if (sendErr) throw new Error(sendErr.message);

    // Auto-send SMS if smsMessage provided or derive a short version
    if (customer.phone && twilioClient) {
      try {
        const sms = smsMessage?.trim()
          || `Hi ${customer.full_name.split(" ")[0]}, ${message.slice(0, 100).replace(/\n+/g, " ")}… — ${companyName}`.slice(0, 160);
        await twilioClient.messages.create({
          from: twilioFrom,
          to: normaliseUKPhone(customer.phone),
          body: normaliseSmsBody(sms),
        });
      } catch (smsErr) {
        await logError({ message: `Admin email SMS failed: ${smsErr instanceof Error ? smsErr.message : String(smsErr)}`, metadata: { bookingId }, level: "warn" });
      }
    }

    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `Custom email sent to customer: "${subject}"`,
      metadata: { subject, sentAt: new Date().toISOString() },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    await logError({ message: `admin send-email failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { bookingId } });
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
  }
}
