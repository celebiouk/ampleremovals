import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadDriverDocument, getDriverDocumentSignedURL } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/drivers/profile/photo
 * Driver uploads their own profile photo.
 * Body: multipart/form-data with `file`.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
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

    const supabase = createAdminClient();

    // Resolve the authenticated driver
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 403 }
      );
    }

    // Upload into the driver's own folder
    const path = await uploadDriverDocument(driver.id, "profile-photo", file);

    await supabase
      .from("drivers")
      .update({ profile_photo_url: path, updated_at: new Date().toISOString() })
      .eq("id", driver.id);

    const signedUrl = await getDriverDocumentSignedURL(path);

    return NextResponse.json({ success: true, signedUrl });
  } catch (error) {
    console.error("POST driver photo error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}
