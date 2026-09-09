import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/admin/me — the current logged-in user's own admin_users row (role +
 * allowed_pages), or null if they don't have one (treated as unrestricted, same
 * as the app's default before this feature existed). No admin/super-admin
 * requirement — every logged-in user can read their own record.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_users")
    .select("role, is_active, allowed_pages")
    .eq("supabase_user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ success: true, admin: data ?? null });
}
