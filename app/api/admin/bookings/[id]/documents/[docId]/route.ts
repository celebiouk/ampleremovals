import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteBookingDocument } from "@/lib/storage";

/**
 * DELETE /api/admin/bookings/[id]/documents/[docId]
 * Delete a booking document
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: bookingId, docId } = await context.params;
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch document to confirm it belongs to this booking
    const { data: document, error: fetchError } = await supabase
      .from("booking_documents")
      .select("*")
      .eq("id", docId)
      .eq("booking_id", bookingId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete from Supabase Storage
    await deleteBookingDocument(document.file_path);

    // Delete database record
    const { error: deleteError } = await supabase
      .from("booking_documents")
      .delete()
      .eq("id", docId);

    if (deleteError) {
      throw deleteError;
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `Document deleted: ${document.file_name}`,
      metadata: { file_type: document.file_type },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const supabase = await createClient();
    await supabase.from("server_logs").insert({
      level: "error",
      message: "Failed to delete booking document",
      metadata: { error: String(err) },
    });

    return NextResponse.json(
      { success: false, error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
