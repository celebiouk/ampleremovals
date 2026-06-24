/**
 * POST /api/drivers/anyvan-jobs — a driver records an AnyVan job they did. The job
 * is attributed to them; the 48h cron then sends the customer the rating request.
 */
import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const auth = await requireDriver();
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
    const driver_name = auth.driver.preferred_name || auth.driver.first_name || "Our driver";
    const { data, error } = await supabase.from("anyvan_jobs").insert({
      customer_name, phone,
      email: (b?.email ?? "").trim() || null,
      amount: b?.amount != null && b.amount !== "" ? Number(b.amount) : null,
      job_at,
      driver_id: auth.driver.id,
      driver_name,
      created_by: "driver",
    }).select("id").single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
