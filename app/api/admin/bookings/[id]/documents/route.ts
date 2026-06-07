import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  uploadBookingDocument,
  getBookingDocumentSignedURL,
} from "@/lib/storage";

/**
 * GET /api/admin/bookings/[id]/documents
 * List all documents for a booking with signed URLs
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all documents for this booking
    const { data: documents, error: fetchError } = await supabase
      .from("booking_documents")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    // Generate signed URLs for each document
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        try {
          const signedUrl = await getBookingDocumentSignedURL(doc.file_path);
          return {
            id: doc.id,
            fileName: doc.file_name,
            fileSize: doc.file_size,
            fileType: doc.file_type,
            uploadedBy: doc.uploaded_by,
            createdAt: doc.created_at,
            signedUrl,
          };
        } catch (err) {
          // If URL generation fails for one file, still return others
          console.error(`Failed to generate URL for ${doc.file_name}:`, err);
          return {
            id: doc.id,
            fileName: doc.file_name,
            fileSize: doc.file_size,
            fileType: doc.file_type,
            uploadedBy: doc.uploaded_by,
            createdAt: doc.created_at,
            signedUrl: null,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      documents: documentsWithUrls,
    });
  } catch (err) {
    const supabase = await createClient();
    await supabase.from("server_logs").insert({
      level: "error",
      message: "Failed to fetch booking documents",
      metadata: { error: String(err) },
    });

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/bookings/[id]/documents
 * Upload a new document
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Allowed: JPG, PNG, WebP, PDF, Word",
        },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const { path, fileName, fileSize } = await uploadBookingDocument(
      bookingId,
      file
    );

    // Insert record into database
    const { data: document, error: insertError } = await supabase
      .from("booking_documents")
      .insert({
        booking_id: bookingId,
        file_name: fileName,
        file_path: path,
        file_size: fileSize,
        file_type: file.type,
        uploaded_by: "admin",
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `Document uploaded: ${fileName}`,
      metadata: { file_type: file.type, file_size: fileSize },
      performed_by: "admin",
    });

    // Generate signed URL for immediate display
    const signedUrl = await getBookingDocumentSignedURL(path);

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.file_name,
        fileSize: document.file_size,
        fileType: document.file_type,
        uploadedBy: document.uploaded_by,
        createdAt: document.created_at,
        signedUrl,
      },
    });
  } catch (err) {
    const supabase = await createClient();
    await supabase.from("server_logs").insert({
      level: "error",
      message: "Failed to upload booking document",
      metadata: { error: String(err) },
    });

    return NextResponse.json(
      { success: false, error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
