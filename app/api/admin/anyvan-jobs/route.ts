/**
 * /api/admin/anyvan-jobs — admin records an AnyVan job (POST) and lists them (GET).
 * Minimal fields: customer name, phone, email (optional), amount, delivery date/time,
 * and the driver who did it. The 48h cron then sends the rating request.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const b = await req.json().catch(() => null) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const customer_name = (b?.customer_name ?? "").trim();
    const phone = (b?.phone ?? "").trim();
    const job_at = b?.job_at;
    if (!customer_name || !phone || !job_at) {
      return NextResponse.json({ success: false, error: "Name, phone and delivery date/time are required" }, { status: 400 });
    }
    const supabase = createAdminClient();
    let driver_name = (b?.driver_name ?? "").trim() || null;
    if (b?.driver_id && !driver_name) {
      const { data: d } = await supabase.from("drivers").select("first_name, last_name, preferred_name").eq("id", b.driver_id).maybeSingle();
      if (d) driver_name = d.preferred_name || [d.first_name, d.last_name].filter(Boolean).join(" ");
    }
    const { data, error } = await supabase.from("anyvan_jobs").insert({
      customer_name, phone,
      email: (b?.email ?? "").trim() || null,
      amount: b?.amount != null && b.amount !== "" ? Number(b.amount) : null,
      job_at,
      driver_id: b?.driver_id || null,
      driver_name,
      created_by: "admin",
    }).select("id").single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("anyvan_jobs").select("*").order("job_at", { ascending: false }).limit(200);
    return NextResponse.json({ success: true, jobs: data ?? [] });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
