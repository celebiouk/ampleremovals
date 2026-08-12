/**
 * POST /api/webhooks/twilio/status
 * Twilio delivery-status callbacks for OUTBOUND messages (queued → sent →
 * delivered → read, or failed/undelivered). Updates the stored message by SID.
 */
import { NextResponse, type NextRequest } from "next/server";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const params: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (form as any).forEach((v: any, k: string) => { params[k] = String(v); });

    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const signature = request.headers.get("x-twilio-signature");
    if (authToken && signature && process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https")) {
      const url = `${process.env.NEXT_PUBLIC_SITE_URL}${new URL(request.url).pathname}`;
      if (!twilio.validateRequest(authToken, signature, url, params)) {
        return new NextResponse("Invalid signature", { status: 403 });
      }
    }

    const sid = params.MessageSid || params.SmsSid;
    const status = (params.MessageStatus || params.SmsStatus || "").toLowerCase();
    if (!sid || !status) return NextResponse.json({ ok: true });

    const now = new Date().toISOString();
    const update: Record<string, unknown> = { status, updated_at: now };
    if (status === "delivered") update.delivered_at = now;
    if (status === "read") update.read_at = now;
    if (status === "sent") update.sent_at = now;
    if (params.ErrorMessage) update.error_message = params.ErrorMessage;
    if (params.ErrorCode && !params.ErrorMessage) update.error_message = `Twilio error ${params.ErrorCode}`;

    const supabase = createAdminClient();
    await supabase.from("messages").update(update).eq("twilio_sid", sid);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
