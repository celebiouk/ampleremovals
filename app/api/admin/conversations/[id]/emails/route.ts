import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * GET /api/admin/conversations/[id]/emails
 * Outbound emails we've sent to this conversation's customer, so the web inbox
 * can interleave them with SMS/WhatsApp. Keyed on the customer (not the phone),
 * so an email shows even if it was sent before the phone thread existed.
 * Web-only — the mobile app never calls this, keeping its inbox SMS/WhatsApp.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data: convo } = await supabase.from("conversations").select("customer_id").eq("id", params.id).single();
  if (!convo?.customer_id) return NextResponse.json({ success: true, emails: [] });

  const { data } = await supabase
    .from("customer_emails")
    .select("id, to_email, from_email, subject, preview, status, error_message, created_at")
    .eq("customer_id", convo.customer_id)
    .order("created_at", { ascending: true })
    .limit(500);

  return NextResponse.json({ success: true, emails: data ?? [] });
}
