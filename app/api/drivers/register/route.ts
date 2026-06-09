import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

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
      performed_by: "driver",
    });

    // Send emails
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      // Email to admin
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "bookings@ampleremovals.com",
        to: process.env.RESEND_ADMIN_EMAIL || "admin@ampleremovals.com",
        subject: `🚨 New Driver Application: ${firstName} ${lastName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6b21a8;">New Driver Application Received</h2>
            <p>A new driver has submitted their application and is waiting for approval.</p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Driver Details:</h3>
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              ${preferredName ? `<p><strong>Preferred Name:</strong> ${preferredName}</p>` : ''}
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Date of Birth:</strong> ${dateOfBirth}</p>
              ${emergencyContactName ? `<p><strong>Emergency Contact:</strong> ${emergencyContactName} (${emergencyContactPhone})</p>` : ''}
              ${drivingLicenceNumber ? `<p><strong>Driving Licence:</strong> ${drivingLicenceNumber}</p>` : ''}
            </div>

            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Go to Admin Panel → Drivers</li>
              <li>Click "Pending Approval" tab</li>
              <li>Review application</li>
              <li>Click "Quick Approve" or edit manually</li>
            </ol>

            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/drivers"
               style="display: inline-block; background: #6b21a8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
              Review Application
            </a>
          </div>
        `,
      });

      // Email to driver
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "bookings@ampleremovals.com",
        to: email,
        subject: "Application Received - Ample Removals Driver Team",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6b21a8;">Application Received!</h2>
            <p>Hi ${firstName},</p>
            <p>Thank you for applying to join our driver team at Ample Removals!</p>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
              <p style="margin: 0;"><strong>📋 Your application is now pending approval.</strong></p>
              <p style="margin: 8px 0 0 0;">Our team will review your details and get back to you within 24-48 hours.</p>
            </div>

            <p><strong>What happens next?</strong></p>
            <ol>
              <li>Our admin team reviews your application</li>
              <li>You'll receive an email when approved</li>
              <li>You can then log in at <a href="${process.env.NEXT_PUBLIC_SITE_URL}/drivers/login">Driver Portal</a></li>
              <li>Start accepting jobs!</li>
            </ol>

            <p>If you have any questions, please reply to this email.</p>

            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>Ample Removals Team</strong>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send emails:", emailError);
      // Don't fail the registration if emails fail
    }

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
