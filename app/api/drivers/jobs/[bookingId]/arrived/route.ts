/**
 * POST /api/drivers/jobs/[bookingId]/arrived — driver confirmed arrival (Call 4,
 * GPS-detected on device). Body: { leg, lat, lng }. Fires arrived notifications.
 */

import { NextResponse } from "next/server";
import { requireDriver, driverAssignedTo } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { recordArrived } from "@/lib/driver-eta";

export async function POST(req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const { leg, lat, lng } = await req.json();
    if (leg !== "pickup" && leg !== "delivery") {
      return NextResponse.json({ success: false, error: "leg must be pickup|delivery" }, { status: 400 });
    }
    const supabase = createAdminClient();
    if (!(await driverAssignedTo(supabase, params.bookingId, auth.driver.id))) {
      return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });
    }
    await recordArrived(supabase, params.bookingId, leg, auth.driver, Number(lat) || 0, Number(lng) || 0);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
