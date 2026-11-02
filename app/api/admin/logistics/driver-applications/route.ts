import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/logistics/driver-applications — list, newest first, optional ?status= filter. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const status = req.nextUrl.searchParams.get("status");
  const supabase = createAdminClient();
  let query = supabase
    .from("logistics_driver_applications")
    .select("id, reference, full_name, town_city, licence_category, experience_years, availability, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: "Couldn't load applications." }, { status: 500 });
  return NextResponse.json({ success: true, applications: data ?? [] });
}
