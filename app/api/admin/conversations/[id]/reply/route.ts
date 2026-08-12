import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

export const runtime = "nodejs";

const schema = z.object({
  channel: z.enum(["sms", "whatsapp"]),
  body: z.string().trim().min(1).max(1500),
});

/**
 * POST /api/admin/conversations/[id]/reply — send a reply on the chosen channel.
 * The Twilio wrapper records the outbound message (source of truth) and returns
 * its id; we return the saved row so the UI can show it instantly.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Type a message and pick a channel." }, { status: 400 });
  const { channel, body } = parsed.data;

  const supabase = createAdminClient();
  const { data: convo } = await supabase.from("conversations").select("contact_phone").eq("id", params.id).single();
  if (!convo?.contact_phone) return NextResponse.json({ success: false, error: "Conversation not found." }, { status: 404 });

  const result = channel === "whatsapp"
    ? await sendWhatsApp(convo.contact_phone, body)
    : await sendSMS(convo.contact_phone, body);

  // The wrapper logged the message (sent or failed). Return the saved row.
  let message = null;
  if (result.messageId) {
    const { data } = await supabase
      .from("messages")
      .select("id, twilio_sid, channel, direction, from_number, to_number, body, status, error_message, media_urls, read_at, sent_at, delivered_at, created_at")
      .eq("id", result.messageId)
      .maybeSingle();
    message = data;
  }

  return NextResponse.json({ success: result.success, error: result.error, message });
}
