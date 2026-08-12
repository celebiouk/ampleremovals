import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

export const runtime = "nodejs";

/**
 * POST /api/admin/messages/[id]/retry — resend a failed outbound message. The
 * fresh attempt is logged as a new message; the old failed row is removed so the
 * thread isn't cluttered with a stale failure.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data: msg } = await supabase
    .from("messages")
    .select("id, direction, channel, body, conversation_id")
    .eq("id", params.id)
    .single();
  if (!msg || msg.direction !== "outbound") {
    return NextResponse.json({ success: false, error: "Only failed outbound messages can be retried." }, { status: 400 });
  }
  const { data: convo } = await supabase.from("conversations").select("contact_phone").eq("id", msg.conversation_id).single();
  if (!convo?.contact_phone) return NextResponse.json({ success: false, error: "Conversation not found." }, { status: 404 });

  const result = msg.channel === "whatsapp"
    ? await sendWhatsApp(convo.contact_phone, msg.body ?? "")
    : await sendSMS(convo.contact_phone, msg.body ?? "");

  // Remove the old failed row on a successful retry (the new one replaces it).
  let message = null;
  if (result.messageId && result.messageId !== params.id) {
    await supabase.from("messages").delete().eq("id", params.id);
    const { data } = await supabase
      .from("messages")
      .select("id, twilio_sid, channel, direction, from_number, to_number, body, status, error_message, media_urls, read_at, sent_at, delivered_at, created_at")
      .eq("id", result.messageId)
      .maybeSingle();
    message = data;
  }

  return NextResponse.json({ success: result.success, error: result.error, message });
}
