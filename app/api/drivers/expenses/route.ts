/**
 * /api/drivers/expenses — driver submits an expense with a receipt (POST, → 'pending')
 * or lists their own expenses (GET). The app uploads the receipt to Storage first.
 */
import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const b = await req.json().catch(() => null) as { category?: string; amount?: number; note?: string; receipt_url?: string; booking_id?: string } | null;
    const amount = Number(b?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "A valid amount is required" }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("driver_expenses").insert({
      driver_id: auth.driver.id,
      booking_id: b?.booking_id || null,
      category: (b?.category ?? "other").trim() || "other",
      amount,
      note: (b?.note ?? "").trim() || null,
      receipt_url: b?.receipt_url || null,
      status: "pending",
    }).select("id").single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("driver_expenses").select("*").eq("driver_id", auth.driver.id).order("created_at", { ascending: false }).limit(200);
    return NextResponse.json({ success: true, expenses: data ?? [] });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
