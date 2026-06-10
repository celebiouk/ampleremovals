import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * POST /api/admin/push-token
 * Stores (or refreshes) the calling admin device's Expo push token so the
 * backend can deliver push notifications. Called by the mobile app on login.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: { token?: string; platform?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token || !token.startsWith("ExponentPushToken")) {
    return NextResponse.json({ success: false, error: "Invalid push token" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admin_push_tokens")
    .upsert(
      { supabase_user_id: auth.userId, expo_token: token, platform: body.platform ?? null, updated_at: new Date().toISOString() },
      { onConflict: "expo_token" }
    );

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
