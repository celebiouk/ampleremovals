/**
 * POST /api/drivers/push-token — register this device's Expo push token for the
 * signed-in driver. DELETE — unregister (on sign-out).
 */

import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ success: false, error: "token required" }, { status: 400 });
    const supabase = createAdminClient();
    await supabase.from("driver_push_tokens").upsert(
      { expo_token: token, driver_id: auth.driver.id, updated_at: new Date().toISOString() },
      { onConflict: "expo_token" }
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const { token } = await req.json();
    const supabase = createAdminClient();
    if (token) await supabase.from("driver_push_tokens").delete().eq("expo_token", token);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
