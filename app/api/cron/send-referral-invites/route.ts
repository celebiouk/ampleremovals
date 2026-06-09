import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

/**
 * GET /api/cron/send-referral-invites
 * Runs daily at 12:00 PM UK time
 * Sends referral program invite 1 month after job completion
 */
export async function GET(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Calculate date 30 days ago (1 month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const targetDate = oneMonthAgo.toISOString().split("T")[0];

    console.log(`🎁 Looking for jobs completed on ${targetDate} (30 days ago)`);

    // Find completed jobs from exactly 30 days ago
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        customer:customers!inner(id, full_name, email, phone, referral_code, referral_email_sent_at)
      `)
      .eq("status", "job_completed")
      .gte("job_completed_at", `${targetDate}T00:00:00Z`)
      .lte("job_completed_at", `${targetDate}T23:59:59Z`);

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found for referral invites");
      return NextResponse.json({
        success: true,
        message: "No referral invites to send",
        count: 0,
      });
    }

    console.log(`Found ${bookings.length} booking(s) for referral invites`);

    // Send referral invites
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          referral_code: string;
          referral_email_sent_at: string | null;
        };

        // Skip if already sent
        if (customer.referral_email_sent_at) {
          console.log(`Skipping ${customer.email} - already sent`);
          return { id: booking.id, success: true, skipped: true };
        }

        // Generate referral code if doesn't exist
        let referralCode = customer.referral_code;
        if (!referralCode) {
          // Call the SQL function to generate code
          const { data: codeData } = await supabase.rpc("generate_referral_code", {
            customer_name: customer.full_name,
          });
          referralCode = codeData;

          await supabase
            .from("customers")
            .update({ referral_code: referralCode })
            .eq("id", customer.id);
        }

        const referralUrl = `${process.env.NEXT_PUBLIC_SITE_URL}?ref=${referralCode}`;

        // EMAIL
        const emailSubject = `${customer.full_name}, give £20 & get £20! 🎁`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0 0 8px 0; font-size: 28px;">🎁 Refer & Earn!</h1>
              <p style="color: #e9d5ff; margin: 0; font-size: 16px;">Give £20, Get £20</p>
            </div>
            <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                It's been a month since we helped you move. We hope you're settling in well! 🏡
              </p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                Know someone planning a move? <strong>Help them save £20</strong> and <strong>earn £20 credit</strong> for yourself!
              </p>

              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; padding: 28px; margin: 32px 0; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 12px 0; font-size: 18px; color: #78350f; font-weight: bold;">💰 Your Referral Rewards</p>
                <div style="display: flex; justify-content: center; gap: 20px; margin: 20px 0;">
                  <div style="flex: 1; max-width: 200px;">
                    <p style="margin: 0; font-size: 36px; font-weight: bold; color: #16a34a;">£20</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #92400e;">Your Friend Saves</p>
                  </div>
                  <div style="flex: 1; max-width: 200px;">
                    <p style="margin: 0; font-size: 36px; font-weight: bold; color: #6b21a8;">£20</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #92400e;">You Earn</p>
                  </div>
                </div>
              </div>

              <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e40af;">📲 Your Personal Referral Link:</p>
                <div style="background: white; padding: 12px; border-radius: 6px; margin: 12px 0;">
                  <a href="${referralUrl}" style="color: #6b21a8; word-break: break-all; font-size: 14px;">${referralUrl}</a>
                </div>
                <p style="margin: 12px 0 0 0; font-size: 14px; color: #1e3a8a;">
                  <strong>Your Code:</strong> <span style="background: #fef3c7; padding: 4px 12px; border-radius: 4px; font-weight: bold; color: #6b21a8;">${referralCode}</span>
                </p>
              </div>

              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e293b;">🎯 How It Works:</p>
                <ol style="margin: 0; padding-left: 20px; color: #64748b; line-height: 1.8;">
                  <li>Share your link or code with friends & family</li>
                  <li>They get £20 off their first move</li>
                  <li>When they complete their move, you get £20 credit</li>
                  <li>No limit! Refer as many people as you like</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${referralUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">
                  Share Your Link
                </a>
              </div>

              <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 32px;">
                💬 Easy to share via WhatsApp, Facebook, Email, or just tell them your code: <strong>${referralCode}</strong>
              </p>

              <p style="font-size: 14px; color: #64748b; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                Thank you for being a valued customer!<br>
                <strong style="color: #6b21a8;">The Ample Removals Team</strong>
              </p>
            </div>
          </div>
        `;

        try {
          await resend.emails.send({
            from: resendFrom,
            to: customer.email,
            subject: emailSubject,
            html: emailBody,
          });
          console.log(`✅ Referral email sent to ${customer.email}`);
        } catch (emailErr) {
          console.error(`❌ Email failed:`, emailErr);
        }

        // SMS
        const smsBody = `🎁 Hi ${customer.full_name}! Refer a friend & you BOTH get £20! Your code: ${referralCode}\nShare: ${referralUrl}\nNo limit - refer as many as you like! - Ample Removals`;

        try {
          await sendSMS(customer.phone, smsBody);
          console.log(`✅ SMS sent to ${customer.phone}`);
        } catch (smsErr) {
          console.error(`❌ SMS failed:`, smsErr);
        }

        // WhatsApp
        const whatsappBody = `🎁 *Refer & Earn £20!*\n\nHi ${customer.full_name}!\n\nKnow someone moving? Help them save *£20* and earn *£20 credit* for yourself!\n\n✅ Your friend gets £20 off\n✅ You get £20 credit\n✅ No limit - refer as many as you like!\n\n*Your Code:* ${referralCode}\n\n*Share Your Link:*\n${referralUrl}\n\nThanks for being a valued customer! 💜\n\nAmple Removals`;

        try {
          await sendWhatsApp(customer.phone, whatsappBody);
          console.log(`✅ WhatsApp sent to ${customer.phone}`);
        } catch (whatsappErr) {
          console.error(`❌ WhatsApp failed:`, whatsappErr);
        }

        // Mark as sent
        await supabase
          .from("customers")
          .update({ referral_email_sent_at: new Date().toISOString() })
          .eq("id", customer.id);

        // Log activity
        await supabase.from("activity_log").insert({
          booking_id: booking.id,
          action: "Referral program invite sent",
          metadata: { referral_code: referralCode, sent_to: customer.email },
          performed_by: "system",
        });

        return { id: booking.id, success: true };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;

    console.log(`Processed ${bookings.length} referral invites, ${successful} successful`);

    return NextResponse.json({
      success: true,
      message: `Sent referral invites to ${successful} customers`,
      count: bookings.length,
      successful,
    });
  } catch (error) {
    console.error("Referral invite cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
