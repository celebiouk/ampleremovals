import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { findOrCreateConversation, normalisePhone } from "@/lib/message-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * GET /api/admin/customers/[id]/conversation — the conversation for a customer
 * (created on demand), plus the first page of messages. Powers the "Messages"
 * tab on the customer profile.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data: customer } = await supabase.from("customers").select("id, phone").eq("id", params.id).single();
  if (!customer) return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });

  const e164 = normalisePhone(customer.phone);
  if (!e164) return NextResponse.json({ success: true, hasPhone: false, conversationId: null, messages: [], hasMore: false, nextBefore: null });

  const convo = await findOrCreateConversation(supabase, e164, customer.id);

  const limit = 50;
  const { data } = await supabase
    .from("messages")
    .select("id, twilio_sid, channel, direction, from_number, to_number, body, status, error_message, media_urls, read_at, sent_at, delivered_at, created_at")
    .eq("conversation_id", convo.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = data ?? [];

  return NextResponse.json({
    success: true,
    hasPhone: true,
    conversationId: convo.id,
    contactPhone: e164,
    unreadCount: convo.unread_count ?? 0,
    messages: [...rows].reverse(),
    hasMore: rows.length === limit,
    nextBefore: rows.length ? rows[rows.length - 1].created_at : null,
  });
}
