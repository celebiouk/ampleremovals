import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/drivers
 * Fetch all drivers with stats
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch all drivers
    const { data: drivers, error } = await supabase
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch drivers error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch drivers" },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: drivers?.length || 0,
      active: drivers?.filter((d) => d.status === "active").length || 0,
      inactive:
        drivers?.filter((d) =>
          ["inactive", "suspended", "on_leave"].includes(d.status)
        ).length || 0,
      jobsThisWeek: 0, // TODO: Calculate from assignments
    };

    // Enhance drivers with job count and earnings owed
    const enhancedDrivers = await Promise.all(
      (drivers || []).map(async (driver) => {
        // Get job count
        const { count: jobCount } = await supabase
          .from("booking_driver_assignments")
          .select("*", { count: "exact", head: true })
          .eq("driver_id", driver.id);

        // Get earnings owed (approved but not paid)
        const { data: earnings } = await supabase
          .from("driver_earnings")
          .select("total_earnings")
          .eq("driver_id", driver.id)
          .eq("status", "approved");

        const earningsOwed = earnings?.reduce(
          (sum, e) => sum + (e.total_earnings || 0),
          0
        ) || 0;

        return {
          ...driver,
          job_count: jobCount || 0,
          earnings_owed: earningsOwed,
        };
      })
    );

    return NextResponse.json({
      success: true,
      drivers: enhancedDrivers,
      stats,
    });
  } catch (error) {
    console.error("GET /api/admin/drivers error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/drivers
 * Create a new driver account
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
      emergencyContactName,
      emergencyContactPhone,
      status,
      defaultPayPercentage,
    } = body;

    // Validation
    if (!firstName || !lastName || !dateOfBirth || !email || !phone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Generate temporary password
    const tempPassword = `Driver${Math.random().toString(36).slice(2, 10)}!${Math.floor(Math.random() * 100)}`;

    // Create Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error("Auth user creation error:", authError);
      return NextResponse.json(
        { success: false, error: "Failed to create auth account" },
        { status: 500 }
      );
    }

    // Create driver record
    const { data: driver, error: driverError } = await supabase
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
        status: status || "active",
        default_pay_percentage: defaultPayPercentage || 0,
      })
      .select()
      .single();

    if (driverError) {
      console.error("Driver creation error:", driverError);
      // Cleanup: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: "Failed to create driver record" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      action: `Driver account created: ${firstName} ${lastName}`,
      metadata: { driver_id: driver.id, email },
    });

    // TODO: Send welcome email to driver with temporary password

    return NextResponse.json({
      success: true,
      driver,
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    console.error("POST /api/admin/drivers error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
