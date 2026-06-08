import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/call-back-reminders/[id]
 * Mark reminder as completed or cancelled
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get admin user ID
    const { data: adminUser } = await supabaseAuth
      .from("admin_users")
      .select("id")
      .eq("supabase_user_id", user.id)
      .single();

    const { id: reminderId } = await context.params;
    const body = await req.json();
    const { status } = body; // "completed" or "cancelled"

    if (!status || !["completed", "cancelled"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = { status };
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = adminUser?.id;
    }

    const { error } = await supabase
      .from("call_back_reminders")
      .update(updateData)
      .eq("id", reminderId);

    if (error) {
      console.error("Update reminder error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update reminder" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Reminder marked as ${status}`,
    });
  } catch (error) {
    console.error("Update reminder error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
