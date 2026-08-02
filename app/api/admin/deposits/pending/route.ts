import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// This is an action queue — admins confirm from it in real time. Never cached.
export const fetchCache = "force-no-store";

/**
 * GET /api/admin/deposits/pending
 * Every booking whose deposit invoice has been sent but not yet verified — i.e.
 * the deposits the team still needs to check for in the bank and confirm.
 * "Claimed" ones (customer tapped "I've made the payment") sort to the top.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, reference, service_type, move_date, created_at, deposit_amount, deposit_status, customer:customers!inner(full_name, phone)"
    )
    .eq("status", "deposit_invoice_sent")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: "Couldn't load deposits." }, { status: 500 });
  }

  const items = (data ?? []).map((b) => {
    const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
    return {
      id: b.id as string,
      reference: b.reference as string,
      service_type: b.service_type as string,
      move_date: (b.move_date as string) ?? null,
      created_at: b.created_at as string,
      deposit_amount: (b.deposit_amount as number) ?? null,
      // "claimed" = customer says they've paid (highest priority to check).
      claimed: b.deposit_status === "claimed",
      customer_name: customer?.full_name ?? "—",
      customer_phone: customer?.phone ?? null,
    };
  });
  // Claimed first (customer is waiting on us), then oldest-first within each group.
  items.sort((a, b) => Number(b.claimed) - Number(a.claimed));

  return NextResponse.json({ success: true, items });
}
