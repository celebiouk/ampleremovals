import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * DELETE /api/admin/invoices/[id]
 * Deletes an invoice (super admin only)
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

    // Hardcoded super admin check
    if (user.email !== "ampleremovals@gmail.com") {
      return NextResponse.json(
        {
          success: false,
          error: `Only super admin can delete invoices. Your email: ${user.email}`
        },
        { status: 403 }
      );
    }

    const { id: invoiceId } = await context.params;
    const supabase = createAdminClient();

    // Check if invoice exists
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("invoice_number, booking_id, status")
      .eq("id", invoiceId)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of paid invoices (safeguard)
    if (invoice.status === "paid") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete a paid invoice. This is a safeguard to prevent accounting issues."
        },
        { status: 400 }
      );
    }

    // Delete the invoice
    const { error: deleteError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (deleteError) {
      console.error("Delete invoice error:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete invoice" },
        { status: 500 }
      );
    }

    // Log the deletion
    await supabase.from("server_logs").insert({
      level: "warn",
      message: `Invoice deleted by super admin`,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        booking_id: invoice.booking_id,
        deleted_by: user.email,
      },
    });

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: invoice.booking_id,
      action: `Invoice ${invoice.invoice_number} deleted by admin`,
      metadata: { invoiceId, invoiceNumber: invoice.invoice_number },
      performed_by: "admin",
    });

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoice_number} deleted successfully`,
    });
  } catch (error) {
    console.error("Delete invoice exception:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
