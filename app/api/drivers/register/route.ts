import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/drivers/register
 * Driver self-registration (pending admin approval)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      preferredName,
      dateOfBirth,
      email,
      phone,
      password,
      emergencyContactName,
      emergencyContactPhone,
      drivingLicenceNumber,
      drivingLicenceExpiry,
    } = body;

    // Validation
    if (!firstName || !lastName || !dateOfBirth || !email || !phone || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("drivers")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 400 }
      );
    }

    // Create Auth user (but don't confirm email yet)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/drivers/login`,
      },
    });

    if (authError || !authData.user) {
      console.error("Auth signup error:", authError);
      return NextResponse.json(
        { success: false, error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Create driver record with pending_approval status
    const { error: driverError } = await supabase
      .from("drivers")
      .insert({
        auth_user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        preferred_name: preferredName,
        date_of_birth: dateOfBirth,
        email,
        phone,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        driving_licence_number: drivingLicenceNumber,
        driving_licence_expiry: drivingLicenceExpiry,
        status: "inactive", // Start as inactive, admin will activate
        default_pay_percentage: 0, // Admin will set this
      });

    if (driverError) {
      console.error("Driver creation error:", driverError);
      // Cleanup: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: "Failed to create driver profile" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      action: `New driver application: ${firstName} ${lastName} (${email})`,
      metadata: { email, status: "pending_approval" },
    });

    // TODO: Send notification email to admins about new driver application
    // TODO: Send confirmation email to driver

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("POST /api/drivers/register error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
