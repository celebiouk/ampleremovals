import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminAuth } from "@/lib/auth-check";
import type { AdminUser } from "@/types";

/**
 * GET /api/admin/users
 * List all admin users (super admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if current user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get current admin user
    const { data: currentAdmin, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("supabase_user_id", user.id)
      .single();

    if (adminError || !currentAdmin) {
      return NextResponse.json({ success: false, error: "Admin user not found" }, { status: 404 });
    }

    // Only super admins can view all users
    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Super admin access required" }, { status: 403 });
    }

    // Fetch all admin users
    const { data: adminUsers, error: fetchError } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({ success: true, users: adminUsers as AdminUser[] });
  } catch (err) {
    const supabase = await createClient();
    await supabase.from("server_logs").insert({
      level: "error",
      message: "Failed to fetch admin users",
      metadata: { error: String(err) },
    });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Create a new admin user (super admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json() as {
      email: string;
      full_name: string;
      password: string;
      role?: "admin" | "super_admin";
    };

    // Check if current user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get current admin user
    const { data: currentAdmin, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("supabase_user_id", user.id)
      .single();

    if (adminError || !currentAdmin) {
      return NextResponse.json({ success: false, error: "Admin user not found" }, { status: 404 });
    }

    // Only super admins can create users
    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Super admin access required" }, { status: 403 });
    }

    // Validate input
    if (!body.email || !body.full_name || !body.password) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Create Supabase Auth user using admin client
    const { createAdminClient } = await import("@/lib/supabase/server");
    const adminClient = createAdminClient();

    const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name,
      },
    });

    if (createAuthError || !authData.user) {
      return NextResponse.json({
        success: false,
        error: createAuthError?.message || "Failed to create auth user"
      }, { status: 400 });
    }

    // Create admin user record
    const { data: newAdmin, error: insertError } = await supabase
      .from("admin_users")
      .insert({
        email: body.email,
        full_name: body.full_name,
        role: body.role || "admin",
        supabase_user_id: authData.user.id,
        created_by: currentAdmin.id,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback: delete auth user if admin record creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw insertError;
    }

    // Log activity
    await supabase.from("admin_activity_log").insert({
      admin_user_id: currentAdmin.id,
      admin_email: currentAdmin.email,
      action: "Created admin user",
      resource_type: "admin_user",
      resource_id: newAdmin.id,
      metadata: { new_admin_email: body.email, role: body.role || "admin" },
    });

    return NextResponse.json({ success: true, user: newAdmin as AdminUser });
  } catch (err) {
    const supabase = await createClient();
    await supabase.from("server_logs").insert({
      level: "error",
      message: "Failed to create admin user",
      metadata: { error: String(err) },
    });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
