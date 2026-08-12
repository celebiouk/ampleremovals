import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const DEFAULT_LIMIT = 50;

/**
 * GET /api/admin/conversations/[id]/messages?before=<ISO>&limit=50
 * Returns a page of messages in chronological order (oldest→newest). Pass the
 * `nextBefore` cursor to load older messages.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const before = url.searchParams.get("before");
  const limit = Math.min(Number(url.searchParams.get("limit")) || DEFAULT_LIMIT, 100);

  const supabase = createAdminClient();
  let query = supabase
    .from("messages")
    .select("id, twilio_sid, channel, direction, from_number, to_number, body, status, error_message, media_urls, read_at, sent_at, delivered_at, created_at")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: "Couldn't load messages." }, { status: 500 });

  const rows = data ?? [];
  const hasMore = rows.length === limit;
  const chronological = [...rows].reverse(); // oldest → newest for display
  const nextBefore = rows.length ? rows[rows.length - 1].created_at : null; // oldest in this page

  return NextResponse.json({ success: true, messages: chronological, hasMore, nextBefore });
}
