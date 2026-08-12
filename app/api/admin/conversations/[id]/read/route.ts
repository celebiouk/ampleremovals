import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

/**
 * POST /api/admin/conversations/[id]/read — the admin opened this thread: clear
 * its unread counter and stamp read_at on the unread inbound messages.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  await supabase.from("conversations").update({ unread_count: 0, updated_at: now }).eq("id", params.id);
  await supabase
    .from("messages")
    .update({ read_at: now })
    .eq("conversation_id", params.id)
    .eq("direction", "inbound")
    .is("read_at", null);

  return NextResponse.json({ success: true });
}
