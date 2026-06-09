import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  uploadDriverDocument,
  getDriverDocumentSignedURL,
  DRIVER_DOC_COLUMN,
  type DriverDocumentType,
} from "@/lib/storage";

const VALID_TYPES: DriverDocumentType[] = [
  "profile-photo",
  "licence-front",
  "licence-back",
];

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/admin/drivers/[id]/documents
 * Upload a driver document (profile photo or driving licence).
 * Body: multipart/form-data with `file` and `docType`.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: driverId } = params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("docType") as DriverDocumentType | null;

    if (!file || !docType) {
      return NextResponse.json(
        { success: false, error: "File and docType are required" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(docType)) {
      return NextResponse.json(
        { success: false, error: "Invalid document type" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File must be under 5MB" },
        { status: 400 }
      );
    }

    // Upload to storage
    const path = await uploadDriverDocument(driverId, docType, file);

    // Save path to the matching drivers column
    const supabase = createAdminClient();
    const column = DRIVER_DOC_COLUMN[docType];
    await supabase
      .from("drivers")
      .update({ [column]: path, updated_at: new Date().toISOString() })
      .eq("id", driverId);

    await supabase.from("activity_log").insert({
      action: `Driver document uploaded: ${docType}`,
      metadata: { driver_id: driverId, doc_type: docType },
      performed_by: "admin",
    });

    // Return a signed URL for immediate display
    const signedUrl = await getDriverDocumentSignedURL(path);

    return NextResponse.json({ success: true, path, signedUrl });
  } catch (error) {
    console.error("POST driver documents error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/drivers/[id]/documents
 * Return signed URLs for all of a driver's stored documents.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: driverId } = params;
    const supabase = createAdminClient();

    const { data: driver, error } = await supabase
      .from("drivers")
      .select("profile_photo_url, driving_licence_front_url, driving_licence_back_url")
      .eq("id", driverId)
      .single();

    if (error || !driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 404 }
      );
    }

    // Resolve each stored path to a signed URL (null if not uploaded)
    const resolve = async (path: string | null) =>
      path ? await getDriverDocumentSignedURL(path) : null;

    const [profilePhoto, licenceFront, licenceBack] = await Promise.all([
      resolve(driver.profile_photo_url),
      resolve(driver.driving_licence_front_url),
      resolve(driver.driving_licence_back_url),
    ]);

    return NextResponse.json({
      success: true,
      documents: {
        "profile-photo": profilePhoto,
        "licence-front": licenceFront,
        "licence-back": licenceBack,
      },
    });
  } catch (error) {
    console.error("GET driver documents error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
