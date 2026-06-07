import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * DELETE /api/admin/users/[id]
 * Delete an admin user (super admin only)
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

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

    // Get user to delete
    const { data: userToDelete, error: fetchError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !userToDelete) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Cannot delete yourself
    if (userToDelete.id === currentAdmin.id) {
      return NextResponse.json({ success: false, error: "Cannot delete your own account" }, { status: 400 });
    }

    // Cannot delete the main super admin (ampleremovals@gmail.com)
    if (userToDelete.email === "ampleremovals@gmail.com") {
      return NextResponse.json({ success: false, error: "Cannot delete the main super admin" }, { status: 400 });
    }

    // Delete from Supabase Auth
    if (userToDelete.supabase_user_id) {
      const adminClient = createAdminClient();
      await adminClient.auth.admin.deleteUser(userToDelete.supabase_user_id);
    }

    // Delete admin user record (cascade will handle activity logs)
    const { error: deleteError } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    // Log activity
    await supabase.from("admin_activity_log").insert({
      admin_user_id: currentAdmin.id,
      admin_email: currentAdmin.email,
      action: "Deleted admin user",
      resource_type: "admin_user",
      resource_id: id,
      metadata: { deleted_email: userToDelete.email },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const supabase = await createClient();
    await supabase.from("server_logs").insert({
      level: "error",
      message: "Failed to delete admin user",
      metadata: { error: String(err) },
    });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update admin user (deactivate, change password, etc.) - super admin only
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body = await req.json() as {
      is_active?: boolean;
      new_password?: string;
    };

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

    // Get user to update
    const { data: userToUpdate, error: fetchError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !userToUpdate) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Cannot deactivate yourself
    if (userToUpdate.id === currentAdmin.id && body.is_active === false) {
      return NextResponse.json({ success: false, error: "Cannot deactivate your own account" }, { status: 400 });
    }

    // Update password if provided
    if (body.new_password && userToUpdate.supabase_user_id) {
      const adminClient = createAdminClient();
      const { error: passwordError } = await adminClient.auth.admin.updateUserById(
        userToUpdate.supabase_user_id,
        { password: body.new_password }
      );

      if (passwordError) {
        return NextResponse.json({
          success: false,
          error: `Failed to update password: ${passwordError.message}`
        }, { status: 400 });
      }

      // Log password change
      await supabase.from("admin_activity_log").insert({
        admin_user_id: currentAdmin.id,
        admin_email: currentAdmin.email,
        action: "Changed admin password",
        resource_type: "admin_user",
        resource_id: id,
        metadata: { target_email: userToUpdate.email },
      });
    }

    // Update is_active status if provided
    if (typeof body.is_active === "boolean") {
      const { error: updateError } = await supabase
        .from("admin_users")
        .update({ is_active: body.is_active })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      // Log status change
      await supabase.from("admin_activity_log").insert({
        admin_user_id: currentAdmin.id,
        admin_email: currentAdmin.email,
        action: body.is_active ? "Activated admin user" : "Deactivated admin user",
        resource_type: "admin_user",
        resource_id: id,
        metadata: { target_email: userToUpdate.email },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const supabase = await createClient();
    await supabase.from("server_logs").insert({
      level: "error",
      message: "Failed to update admin user",
      metadata: { error: String(err) },
    });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
