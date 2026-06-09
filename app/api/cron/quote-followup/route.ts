import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { formatCurrency } from "@/lib/utils";

/**
 * GET /api/cron/quote-followup
 * Runs hourly - sends follow-ups for unconfirmed quotes
 * Sequence: 2 hours, 24 hours, 3 days, 7 days after quote sent
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
    const now = new Date();

    // Calculate time windows
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    console.log(`📧 Checking for quotes needing follow-up`);

    // Find quotes needing 2-hour follow-up
    const { data: twoHourQuotes } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        quote_sent_at,
        quote_total,
        quote_confirmation_token,
        customer:customers!inner(full_name, email, phone)
      `)
      .not("quote_sent_at", "is", null)
      .is("quote_confirmed_at", null)
      .is("quote_followup_2hr_sent_at", null)
      .lte("quote_sent_at", twoHoursAgo.toISOString());

    // Find quotes needing 24-hour follow-up
    const { data: twentyFourHourQuotes } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        quote_sent_at,
        quote_total,
        quote_confirmation_token,
        customer:customers!inner(full_name, email, phone)
      `)
      .not("quote_sent_at", "is", null)
      .is("quote_confirmed_at", null)
      .is("quote_followup_24hr_sent_at", null)
      .lte("quote_sent_at", twentyFourHoursAgo.toISOString());

    // Find quotes needing 3-day follow-up
    const { data: threeDayQuotes } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        quote_sent_at,
        quote_total,
        quote_confirmation_token,
        customer:customers!inner(full_name, email, phone)
      `)
      .not("quote_sent_at", "is", null)
      .is("quote_confirmed_at", null)
      .is("quote_followup_3day_sent_at", null)
      .lte("quote_sent_at", threeDaysAgo.toISOString());

    // Find quotes needing 7-day follow-up
    const { data: sevenDayQuotes } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        quote_sent_at,
        quote_total,
        quote_confirmation_token,
        customer:customers!inner(full_name, email, phone)
      `)
      .not("quote_sent_at", "is", null)
      .is("quote_confirmed_at", null)
      .is("quote_followup_7day_sent_at", null)
      .lte("quote_sent_at", sevenDaysAgo.toISOString());

    let totalSent = 0;

    // Send 2-hour follow-ups
    if (twoHourQuotes && twoHourQuotes.length > 0) {
      console.log(`Sending 2-hour follow-ups to ${twoHourQuotes.length} customers`);
      await Promise.allSettled(
        twoHourQuotes.map((booking) => send2HourFollowup(booking, supabase))
      );
      totalSent += twoHourQuotes.length;
    }

    // Send 24-hour follow-ups
    if (twentyFourHourQuotes && twentyFourHourQuotes.length > 0) {
      console.log(`Sending 24-hour follow-ups to ${twentyFourHourQuotes.length} customers`);
      await Promise.allSettled(
        twentyFourHourQuotes.map((booking) => send24HourFollowup(booking, supabase))
      );
      totalSent += twentyFourHourQuotes.length;
    }

    // Send 3-day follow-ups
    if (threeDayQuotes && threeDayQuotes.length > 0) {
      console.log(`Sending 3-day follow-ups to ${threeDayQuotes.length} customers`);
      await Promise.allSettled(
        threeDayQuotes.map((booking) => send3DayFollowup(booking, supabase))
      );
      totalSent += threeDayQuotes.length;
    }

    // Send 7-day follow-ups
    if (sevenDayQuotes && sevenDayQuotes.length > 0) {
      console.log(`Sending 7-day follow-ups to ${sevenDayQuotes.length} customers`);
      await Promise.allSettled(
        sevenDayQuotes.map((booking) => send7DayFollowup(booking, supabase))
      );
      totalSent += sevenDayQuotes.length;
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${totalSent} follow-ups`,
      breakdown: {
        twoHour: twoHourQuotes?.length || 0,
        twentyFourHour: twentyFourHourQuotes?.length || 0,
        threeDay: threeDayQuotes?.length || 0,
        sevenDay: sevenDayQuotes?.length || 0,
      },
    });
  } catch (error) {
    console.error("Quote follow-up cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 2-hour follow-up: "Have questions?"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function send2HourFollowup(booking: any, supabase: any) {
  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/confirm-quote/${booking.id}/${booking.quote_confirmation_token}`;

  const emailSubject = `Questions about your quote? We're here to help! - ${booking.reference}`;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6b21a8; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Have Questions About Your Quote?</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
        <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
          We sent you a quote for <strong>${formatCurrency(booking.quote_total)}</strong> earlier today.
        </p>
        <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
          Do you have any questions? We're here to help!
        </p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e293b;">💬 Common Questions:</p>
          <ul style="margin: 0; padding-left: 20px; color: #64748b; line-height: 1.8;">
            <li>What's included in the price?</li>
            <li>When can you schedule our move?</li>
            <li>Do you provide packing materials?</li>
            <li>What's your cancellation policy?</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 12px;">Accept Quote</a><br>
          <a href="tel:07344683477" style="display: inline-block; background: #6b21a8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Call Us: 07344 683477</a>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center;">Booking: ${booking.reference}</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({ from: resendFrom, to: customer.email, subject: emailSubject, html: emailBody });
    await sendSMS(customer.phone, `Hi ${customer.full_name}, questions about your £${booking.quote_total} quote? Call us: 07344683477 or accept: ${confirmUrl} - ${booking.reference}`);
    await sendWhatsApp(customer.phone, `Hi ${customer.full_name}!\n\nHave questions about your *${formatCurrency(booking.quote_total)}* quote?\n\nWe're here to help! Call *07344 683477*\n\nOr accept your quote: ${confirmUrl}\n\nBooking: ${booking.reference}`);

    await supabase.from("bookings").update({ quote_followup_2hr_sent_at: new Date().toISOString() }).eq("id", booking.id);
    await supabase.from("activity_log").insert({ booking_id: booking.id, action: "Quote follow-up sent (2 hours)", performed_by: "system" });
  } catch (err) {
    console.error("2hr follow-up failed:", err);
  }
}

// 24-hour follow-up: "What's included"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function send24HourFollowup(booking: any, supabase: any) {
  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/confirm-quote/${booking.id}/${booking.quote_confirmation_token}`;

  const emailSubject = `Here's what's included in your ${formatCurrency(booking.quote_total)} quote - ${booking.reference}`;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">What's Included in Your Quote</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
        <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
          Still thinking about your move? Here's everything included in your <strong>${formatCurrency(booking.quote_total)}</strong> quote:
        </p>
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0 0 16px 0; font-weight: bold; color: #1e40af;">✅ Included in Your Price:</p>
          <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; line-height: 1.9;">
            <li>Professional, experienced team</li>
            <li>Fully insured service</li>
            <li>All fuel & mileage costs</li>
            <li>Loading & unloading</li>
            <li>Careful handling of your belongings</li>
            <li>No hidden fees</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px;">Accept Quote Now</a>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center;">Booking: ${booking.reference}</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({ from: resendFrom, to: customer.email, subject: emailSubject, html: emailBody });
    await sendSMS(customer.phone, `Your £${booking.quote_total} quote includes: professional team, insurance, fuel, loading/unloading. No hidden fees! Accept: ${confirmUrl} - ${booking.reference}`);
    await sendWhatsApp(customer.phone, `Hi ${customer.full_name}!\n\nYour *${formatCurrency(booking.quote_total)}* quote includes:\n✅ Professional team\n✅ Fully insured\n✅ All fuel costs\n✅ Loading & unloading\n✅ No hidden fees\n\nAccept now: ${confirmUrl}\n\n${booking.reference}`);

    await supabase.from("bookings").update({ quote_followup_24hr_sent_at: new Date().toISOString() }).eq("id", booking.id);
    await supabase.from("activity_log").insert({ booking_id: booking.id, action: "Quote follow-up sent (24 hours)", performed_by: "system" });
  } catch (err) {
    console.error("24hr follow-up failed:", err);
  }
}

// 3-day follow-up: "Quote expires soon - 10% off"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function send3DayFollowup(booking: any, supabase: any) {
  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/confirm-quote/${booking.id}/${booking.quote_confirmation_token}`;
  const discountedPrice = booking.quote_total * 0.9;

  const emailSubject = `⏰ Your quote expires soon - Book today & save 10%! - ${booking.reference}`;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 26px;">⏰ Quote Expires Soon!</h1>
        <p style="color: #fef3c7; margin: 8px 0 0 0; font-size: 16px;">Book today & save 10%</p>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
        <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
          Your quote expires soon, but we don't want you to miss out!
        </p>
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; padding: 24px; margin: 32px 0; border-radius: 12px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 16px; color: #78350f;">🎉 Special Offer - Today Only!</p>
          <p style="margin: 0; font-size: 42px; font-weight: bold; color: #6b21a8;">10% OFF</p>
          <p style="margin: 12px 0 0 0; font-size: 18px; color: #92400e;">
            <span style="text-decoration: line-through;">${formatCurrency(booking.quote_total)}</span>
            → <strong>${formatCurrency(discountedPrice)}</strong>
          </p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">Book Now & Save 10%</a>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">Offer valid for 24 hours only</p>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center;">Booking: ${booking.reference}</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({ from: resendFrom, to: customer.email, subject: emailSubject, html: emailBody });
    await sendSMS(customer.phone, `🎉 10% OFF TODAY! Your quote: £${discountedPrice} (was £${booking.quote_total}). Book now: ${confirmUrl} - Valid 24hrs only! ${booking.reference}`);
    await sendWhatsApp(customer.phone, `⏰ *Quote Expires Soon!*\n\nHi ${customer.full_name},\n\n🎉 *Book today & SAVE 10%*\n\n~~${formatCurrency(booking.quote_total)}~~ → *${formatCurrency(discountedPrice)}*\n\nBook now: ${confirmUrl}\n\n⚠️ Valid for 24 hours only!\n\n${booking.reference}`);

    await supabase.from("bookings").update({ quote_followup_3day_sent_at: new Date().toISOString() }).eq("id", booking.id);
    await supabase.from("activity_log").insert({ booking_id: booking.id, action: "Quote follow-up sent (3 days - 10% off)", performed_by: "system" });
  } catch (err) {
    console.error("3day follow-up failed:", err);
  }
}

// 7-day follow-up: "Final reminder"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function send7DayFollowup(booking: any, supabase: any) {
  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/confirm-quote/${booking.id}/${booking.quote_confirmation_token}`;

  const emailSubject = `Final reminder - We'd love to help with your move - ${booking.reference}`;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6b21a8; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">We'd Love to Help You Move</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
        <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
          We haven't heard back about your quote for <strong>${formatCurrency(booking.quote_total)}</strong>.
        </p>
        <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
          If you've chosen another company, we completely understand. But if you're still looking for a reliable, professional removal service, we're here for you.
        </p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.8;">
            "We've been helping families and businesses move for years, and we'd be honored to help you too. Professional, reliable, and no hidden fees."
          </p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 12px;">Accept Quote</a><br>
          <a href="tel:07344683477" style="color: #6b21a8; font-weight: bold;">Or call us: 07344 683477</a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 32px;">This is our final reminder. We won't email about this quote again.</p>
        <p style="font-size: 14px; color: #64748b; text-align: center;">Booking: ${booking.reference}</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({ from: resendFrom, to: customer.email, subject: emailSubject, html: emailBody });
    await sendSMS(customer.phone, `Hi ${customer.full_name}, final reminder about your £${booking.quote_total} quote. We'd love to help! ${confirmUrl} or call 07344683477. ${booking.reference}`);
    await sendWhatsApp(customer.phone, `Hi ${customer.full_name},\n\nFinal reminder about your *${formatCurrency(booking.quote_total)}* quote.\n\nWe'd love to help with your move! Professional, reliable service.\n\nAccept: ${confirmUrl}\nCall: *07344 683477*\n\n${booking.reference}\n\n(This is our last reminder)`);

    await supabase.from("bookings").update({ quote_followup_7day_sent_at: new Date().toISOString() }).eq("id", booking.id);
    await supabase.from("activity_log").insert({ booking_id: booking.id, action: "Quote follow-up sent (7 days - final)", performed_by: "system" });
  } catch (err) {
    console.error("7day follow-up failed:", err);
  }
}
