import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

/** PATCH /api/admin/whatsapp-queue/[id] { status: "sent" } — mark a queued
 *  WhatsApp message as sent once the admin has tapped the wa.me link. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null) as { status?: string } | null;
  const status = body?.status === "sent" ? "sent" : body?.status === "dismissed" ? "dismissed" : null;
  if (!status) return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("whatsapp_queue")
    .update({ status, sent_at: new Date().toISOString() })
    .eq("id", params.id);
  if (error) return NextResponse.json({ success: false, error: "Couldn't update the message." }, { status: 500 });
  return NextResponse.json({ success: true });
}
