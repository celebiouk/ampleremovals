/**
 * GET /api/admin/bookings/[id]/suggest-driver — ranked driver suggestions for
 * this booking (availability + proximity + workload). Recommendation only.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { suggestDrivers } from "@/lib/driver-assignment";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const suggestions = await suggestDrivers(supabase, params.id);
  return NextResponse.json({ success: true, suggestions });
}
