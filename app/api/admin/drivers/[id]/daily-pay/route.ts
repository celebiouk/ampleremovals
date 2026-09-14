/**
 * GET /api/admin/drivers/[id]/daily-pay?date=YYYY-MM-DD&role=driver|porter&isAnyvan=true|false
 * Lets the assign-driver admin UI show "already committed today: £X of £Y"
 * before submitting — the actual cap is (re)computed server-side in
 * assign-driver/route.ts regardless, this is just for the preview.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { dailyPayStatus } from "@/lib/daily-pay";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const role = url.searchParams.get("role") === "porter" ? "porter" : "driver";
  const isAnyvan = url.searchParams.get("isAnyvan") === "true";
  if (!date) return NextResponse.json({ success: false, error: "date required" }, { status: 400 });

  const status = await dailyPayStatus(params.id, date, role, isAnyvan);
  return NextResponse.json({ success: true, ...status });
}
