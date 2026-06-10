import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/profile — the current admin's own profile.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_users")
    .select("id, email, full_name, role")
    .eq("supabase_user_id", auth.userId)
    .maybeSingle();

  return NextResponse.json({ success: true, profile: data });
}

/**
 * PATCH /api/admin/profile — the signed-in admin updates their own name.
 * Body: { firstName, lastName }. Stored as a combined full_name in both the
 * auth user metadata and the admin_users row.
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: { firstName?: string; lastName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }

  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (!fullName) {
    return NextResponse.json({ success: false, error: "Please enter your name" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1) Auth metadata (drives the greeting / session.user.user_metadata)
  const { error: authErr } = await supabase.auth.admin.updateUserById(auth.userId, {
    user_metadata: { full_name: fullName, first_name: firstName, last_name: lastName },
  });
  if (authErr) {
    return NextResponse.json({ success: false, error: authErr.message }, { status: 500 });
  }

  // 2) admin_users row (source of truth for the team list)
  const { error: rowErr } = await supabase
    .from("admin_users")
    .update({ full_name: fullName })
    .eq("supabase_user_id", auth.userId);
  if (rowErr) {
    return NextResponse.json({ success: false, error: rowErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, fullName });
}
