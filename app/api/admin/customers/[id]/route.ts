/**
 * PATCH /api/admin/customers/[id] — update a customer's name / email / phone.
 * GET   /api/admin/customers/[id] — fetch a single customer.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("customers").select("*").eq("id", params.id).single();
  if (error || !data) return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
  return NextResponse.json({ success: true, customer: data });
}

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is too short").optional(),
  email: z.string().trim().email("Enter a valid email").optional(),
  phone: z.string().trim().min(7, "Enter a valid phone number").optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const update: Record<string, string> = { ...parsed.data };
  if (update.email) update.email = update.email.toLowerCase();

  const { data, error } = await supabase
    .from("customers")
    .update(update)
    .eq("id", params.id)
    .select("id, full_name, email, phone")
    .single();

  if (error) {
    // 23505 = unique violation (the email already belongs to another customer).
    const msg = error.code === "23505"
      ? "That email is already used by another customer."
      : error.message;
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  return NextResponse.json({ success: true, customer: data });
}
