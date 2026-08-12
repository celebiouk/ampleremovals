import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/** GET /api/admin/conversations/[id] — conversation header (customer + phone). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, contact_phone, customer_id, unread_count, customer:customers(id, full_name, email, phone)")
    .eq("id", params.id)
    .single();

  if (error || !data) return NextResponse.json({ success: false, error: "Conversation not found." }, { status: 404 });
  const customer = Array.isArray(data.customer) ? data.customer[0] : data.customer;
  return NextResponse.json({
    success: true,
    conversation: {
      id: data.id,
      contactPhone: data.contact_phone,
      customerId: data.customer_id,
      unreadCount: data.unread_count ?? 0,
      customer: customer ?? null,
    },
  });
}
