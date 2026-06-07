import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AdminActivityLog } from "@/types";

/**
 * GET /api/admin/activity
 * Get admin activity logs (super admin only)
 * Query params: limit, offset, admin_user_id (filter by specific admin)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const filterAdminId = searchParams.get("admin_user_id");

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get current admin
    const { data: currentAdmin, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("supabase_user_id", user.id)
      .single();

    if (adminError || !currentAdmin || currentAdmin.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from("admin_activity_log")
      .select("*, admin_user:admin_users!admin_user_id(full_name, email, role)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filterAdminId) {
      query = query.eq("admin_user_id", filterAdminId);
    }

    const { data: logs, error: fetchError, count } = await query;

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      logs: logs as AdminActivityLog[],
      total: count || 0,
    });
  } catch (err) {
    const supabase = await createClient();
    await supabase.from("server_logs").insert({
      level: "error",
      message: "Failed to fetch admin activity logs",
      metadata: { error: String(err) },
    });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
