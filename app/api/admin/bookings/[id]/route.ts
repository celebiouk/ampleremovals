import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * DELETE /api/admin/bookings/[id]
 * Deletes a booking and all related records
 * Only accessible to super_admin users
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is super_admin
    const { data: adminUser } = await supabaseAuth
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!adminUser || adminUser.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Only super admins can delete bookings" },
        { status: 403 }
      );
    }

    const { id: bookingId } = await context.params;
    const supabase = createAdminClient();

    // Check if booking exists
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("reference")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Delete the booking (CASCADE will handle related records)
    // Due to ON DELETE CASCADE in the database:
    // - removals_details, man_and_van_details, etc. will be deleted
    // - booking_notes will be deleted
    // - status_history will be deleted
    // - activity_log will be deleted
    // - invoices will be deleted
    // - quote_confirmations will be deleted
    const { error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (deleteError) {
      console.error("Delete booking error:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete booking" },
        { status: 500 }
      );
    }

    // Log the deletion
    await supabase.from("server_logs").insert({
      level: "warn",
      message: `Booking deleted by super admin`,
      metadata: {
        booking_id: bookingId,
        reference: booking.reference,
        deleted_by: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Booking ${booking.reference} deleted successfully`,
    });
  } catch (error) {
    console.error("Delete booking exception:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
