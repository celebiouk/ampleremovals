import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const schema = z.object({
  customerId: z.string().uuid().optional(),
  create: z.object({ full_name: z.string().trim().min(2), email: z.string().trim().email() }).optional(),
}).refine((v) => v.customerId || v.create, { message: "Provide a customer or new-customer details." });

/**
 * POST /api/admin/conversations/[id]/assign
 * Link an unassigned (unknown-contact) conversation to a customer — either an
 * existing one ({customerId}) or a new one ({create:{full_name,email}}) created
 * with this conversation's phone number. Backfills customer_id on its messages.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid details." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: convo } = await supabase.from("conversations").select("contact_phone").eq("id", params.id).single();
  if (!convo) return NextResponse.json({ success: false, error: "Conversation not found." }, { status: 404 });

  let customerId = parsed.data.customerId ?? null;
  let customerName: string | null = null;

  if (parsed.data.create) {
    const { data: created, error } = await supabase
      .from("customers")
      .insert({ full_name: parsed.data.create.full_name, email: parsed.data.create.email, phone: convo.contact_phone })
      .select("id, full_name")
      .single();
    if (error || !created) return NextResponse.json({ success: false, error: "Couldn't create the customer." }, { status: 500 });
    customerId = created.id;
    customerName = created.full_name;
  } else {
    const { data: cust } = await supabase.from("customers").select("id, full_name").eq("id", customerId!).single();
    if (!cust) return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    customerName = cust.full_name;
  }

  await supabase.from("conversations").update({ customer_id: customerId, updated_at: new Date().toISOString() }).eq("id", params.id);
  await supabase.from("messages").update({ customer_id: customerId }).eq("conversation_id", params.id);

  return NextResponse.json({ success: true, customerId, customerName });
}
