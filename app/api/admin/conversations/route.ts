import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * GET /api/admin/conversations?q=  — the inbox: every conversation with its
 * latest-message preview, channel, unread count and customer. Newest first.
 */
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, contact_phone, customer_id, last_message_at, last_message_preview, last_message_direction, last_channel, unread_count, " +
        "customer:customers(full_name, email, phone)"
    )
    .not("last_message_at", "is", null)
    .order("last_message_at", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ success: false, error: "Couldn't load conversations." }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items = ((data ?? []) as any[]).map((c) => {
    const customer = Array.isArray(c.customer) ? c.customer[0] : c.customer;
    return {
      id: c.id as string,
      contactPhone: c.contact_phone as string,
      customerId: c.customer_id as string | null,
      customerName: customer?.full_name ?? null,
      lastMessageAt: c.last_message_at as string | null,
      lastMessagePreview: c.last_message_preview as string | null,
      lastMessageDirection: c.last_message_direction as string | null,
      lastChannel: c.last_channel as string | null,
      unreadCount: (c.unread_count as number) ?? 0,
    };
  });

  if (q) {
    items = items.filter((c) =>
      (c.customerName ?? "").toLowerCase().includes(q) ||
      c.contactPhone.toLowerCase().includes(q) ||
      (c.lastMessagePreview ?? "").toLowerCase().includes(q)
    );
  }

  const totalUnread = items.reduce((n, c) => n + (c.unreadCount || 0), 0);
  return NextResponse.json({ success: true, items, totalUnread });
}
