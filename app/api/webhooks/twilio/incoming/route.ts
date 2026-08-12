/**
 * POST /api/webhooks/twilio/incoming
 * Twilio posts here when a customer sends us an SMS **or** WhatsApp message
 * (set this URL on both the SMS number and the WhatsApp sender). Channel is
 * detected from the `whatsapp:` prefix on the From address. Idempotent (dedup on
 * MessageSid) and signature-validated in production.
 */
import { NextResponse, type NextRequest } from "next/server";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/server";
import { recordMessage, channelFromAddress } from "@/lib/message-store";
import { logError } from "@/lib/log-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function twiml(): NextResponse {
  // Empty TwiML → 200, so Twilio doesn't retry or auto-reply.
  return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const params: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (form as any).forEach((v: any, k: string) => { params[k] = String(v); });

    // Verify the request is genuinely from Twilio (prod). Signatures are always
    // computed with the account Auth Token.
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const signature = request.headers.get("x-twilio-signature");
    if (authToken && signature && process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https")) {
      const url = `${process.env.NEXT_PUBLIC_SITE_URL}${new URL(request.url).pathname}`;
      if (!twilio.validateRequest(authToken, signature, url, params)) {
        return new NextResponse("Invalid signature", { status: 403 });
      }
    }

    const from = params.From ?? "";
    const to = params.To ?? "";
    const sid = params.MessageSid || params.SmsSid || null;
    const body = params.Body ?? "";
    const channel = channelFromAddress(from);

    const numMedia = parseInt(params.NumMedia ?? "0", 10) || 0;
    const mediaUrls: string[] = [];
    for (let i = 0; i < numMedia; i++) {
      const u = params[`MediaUrl${i}`];
      if (u) mediaUrls.push(u);
    }

    if (!from || !sid) return twiml();

    const supabase = createAdminClient();
    await recordMessage(supabase, {
      contactPhone: from,          // the customer's number identifies the thread
      twilioSid: sid,
      channel,
      direction: "inbound",
      fromNumber: from,
      toNumber: to,
      body,
      status: "received",
      mediaUrls,
    });

    return twiml();
  } catch (e) {
    await logError({ message: `Twilio incoming webhook failed: ${e instanceof Error ? e.message : String(e)}` });
    // Still 200 so Twilio doesn't hammer retries; we've logged it.
    return twiml();
  }
}
