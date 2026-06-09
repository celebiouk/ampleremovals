import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

/**
 * GET /api/cron/seasonal-campaigns
 * Runs daily at 11:00 AM UK time
 * Sends seasonal campaign emails to past customers
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
    const today = new Date().toISOString().split("T")[0];

    console.log(`🎊 Checking for active seasonal campaigns on ${today}`);

    // Find active campaigns for today
    const { data: campaigns, error: campaignError } = await supabase
      .from("seasonal_campaigns")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", today)
      .gte("end_date", today);

    if (campaignError) {
      console.error("Fetch campaigns error:", campaignError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch campaigns" },
        { status: 500 }
      );
    }

    if (!campaigns || campaigns.length === 0) {
      console.log("No active campaigns today");
      return NextResponse.json({
        success: true,
        message: "No active campaigns",
        count: 0,
      });
    }

    console.log(`Found ${campaigns.length} active campaign(s)`);

    let totalSent = 0;

    // Process each campaign
    for (const campaign of campaigns) {
      // Get customers who completed jobs in the past (potential repeat customers)
      // Exclude those who already received this campaign
      const { data: customers, error: customerError } = await supabase
        .from("customers")
        .select(`
          id,
          full_name,
          email,
          phone,
          bookings!inner(id, status)
        `)
        .eq("bookings.status", "job_completed")
        .not("id", "in", `(
          SELECT customer_id
          FROM campaign_recipients
          WHERE campaign_id = '${campaign.id}'
        )`);

      if (customerError || !customers || customers.length === 0) {
        console.log(`No eligible customers for campaign: ${campaign.name}`);
        continue;
      }

      // Remove duplicates (customers with multiple completed bookings)
      const uniqueCustomers = Array.from(
        new Map(customers.map(c => [c.id, c])).values()
      );

      console.log(`Sending ${campaign.name} to ${uniqueCustomers.length} customers`);

      // Send campaign to customers
      const results = await Promise.allSettled(
        uniqueCustomers.map(async (customer) => {
          const emailSubject = campaign.email_subject || `${campaign.name} - ${campaign.discount_percentage}% OFF!`;
          const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0 0 8px 0; font-size: 32px;">🎊 ${campaign.name}</h1>
                <p style="color: #e9d5ff; margin: 0; font-size: 16px;">${campaign.description}</p>
              </div>
              <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
                <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>

                <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                  As a valued customer, we wanted to share this exclusive seasonal offer with you!
                </p>

                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; padding: 32px; margin: 32px 0; border-radius: 12px; text-align: center;">
                  <p style="margin: 0; font-size: 52px; font-weight: bold; color: #6b21a8; line-height: 1;">${campaign.discount_percentage}% OFF</p>
                  <p style="margin: 12px 0 0 0; font-size: 18px; color: #78350f; font-weight: bold;">All Our Services</p>
                </div>

                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e293b;">📦 Services Include:</p>
                  <ul style="margin: 0; padding-left: 20px; color: #64748b; line-height: 1.8;">
                    <li>House Removals</li>
                    <li>Man and Van</li>
                    <li>House Clearance</li>
                    <li>House Cleaning</li>
                    <li>End of Tenancy Cleaning</li>
                  </ul>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="tel:07344683477" style="display: inline-block; background: #6b21a8; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(107, 33, 168, 0.3);">
                    📞 Book Now & Save ${campaign.discount_percentage}%
                  </a>
                </div>

                <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 24px;">
                  Call <a href="tel:07344683477" style="color: #6b21a8; font-weight: bold;">07344 683477</a><br>
                  and mention: <strong>${campaign.name.toUpperCase()}</strong>
                </p>

                <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 32px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 13px; color: #991b1b;">
                    <strong>⏰ Offer Valid:</strong> ${new Date(campaign.start_date).toLocaleDateString("en-GB")} - ${new Date(campaign.end_date).toLocaleDateString("en-GB")}
                  </p>
                </div>

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
            console.log(`✅ Campaign email sent to ${customer.email}`);
          } catch (emailErr) {
            console.error(`❌ Email failed:`, emailErr);
          }

          // SMS
          try {
            await sendSMS(
              customer.phone,
              `🎊 ${campaign.name}! Get ${campaign.discount_percentage}% OFF all services. Call 07344683477 & mention: ${campaign.name.toUpperCase()}. Valid until ${new Date(campaign.end_date).toLocaleDateString("en-GB")}. - Ample Removals`
            );
          } catch (smsErr) {
            console.error(`❌ SMS failed:`, smsErr);
          }

          // WhatsApp
          try {
            await sendWhatsApp(
              customer.phone,
              `🎊 *${campaign.name}*\n\nHi ${customer.full_name}!\n\n*${campaign.discount_percentage}% OFF* all our services!\n\n📦 House Removals\n📦 Man and Van\n📦 House Clearance\n📦 Cleaning Services\n\nCall *07344 683477*\nMention: *${campaign.name.toUpperCase()}*\n\n⏰ Valid until ${new Date(campaign.end_date).toLocaleDateString("en-GB")}\n\nAmple Removals`
            );
          } catch (whatsappErr) {
            console.error(`❌ WhatsApp failed:`, whatsappErr);
          }

          // Track recipient
          await supabase.from("campaign_recipients").insert({
            campaign_id: campaign.id,
            customer_id: customer.id,
          });

          return { success: true };
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      totalSent += successful;

      // Update campaign email count
      await supabase
        .from("seasonal_campaigns")
        .update({
          email_sent_count: (campaign.email_sent_count || 0) + successful,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);

      console.log(`Sent ${campaign.name} to ${successful} customers`);
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${totalSent} campaign emails`,
      total: totalSent,
    });
  } catch (error) {
    console.error("Seasonal campaigns error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
