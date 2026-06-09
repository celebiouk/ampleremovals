import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

/**
 * GET /api/cron/check-weather
 * Runs daily at 6:00 PM UK time
 * Checks weather for next day's moves and sends alerts if bad weather expected
 * Uses OpenWeatherMap API
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

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = tomorrow.toISOString().split("T")[0];

    console.log(`🌧️ Checking weather for moves on ${targetDate}`);

    // Find bookings with move_date tomorrow
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        move_date,
        weather_alert_sent_at,
        customer:customers!inner(full_name, email, phone),
        destination:addresses!destination_address_id(postcode)
      `)
      .eq("move_date", targetDate)
      .in("status", ["deposit_paid_job_confirmed", "processing", "pending"])
      .is("weather_alert_sent_at", null);

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found for weather check");
      return NextResponse.json({
        success: true,
        message: "No moves tomorrow",
        count: 0,
      });
    }

    console.log(`Found ${bookings.length} move(s) tomorrow - checking weather`);

    const alertsSent: string[] = [];

    // Check weather for each booking
    for (const booking of bookings) {
      const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string; phone: string };
      const destination = Array.isArray(booking.destination) ? booking.destination[0] : booking.destination as { postcode: string };

      // Get weather forecast
      const weatherData = await getWeatherForecast(destination.postcode);

      if (!weatherData) {
        console.log(`⚠️ Could not get weather for ${destination.postcode}`);
        continue;
      }

      // Check if bad weather expected
      const badWeather = checkBadWeather(weatherData);

      if (badWeather.isBad) {
        // Send weather alert
        await sendWeatherAlert(booking, customer, badWeather, supabase);
        alertsSent.push(booking.reference);
      } else {
        console.log(`✅ Good weather for ${booking.reference}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${alertsSent.length} weather alerts`,
      alerts: alertsSent,
    });
  } catch (error) {
    console.error("Weather check error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get weather forecast from OpenWeatherMap API
async function getWeatherForecast(postcode: string) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn("OpenWeatherMap API key not configured");
      return null;
    }

    // First, get coordinates from postcode using postcodes.io
    const postcodeRes = await fetch(`https://api.postcodes.io/postcodes/${postcode.replace(/\s+/g, "")}`);
    if (!postcodeRes.ok) return null;

    const postcodeData = await postcodeRes.json();
    const { latitude, longitude } = postcodeData.result;

    // Get weather forecast from OpenWeatherMap
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
    );

    if (!weatherRes.ok) return null;

    const weatherData = await weatherRes.json();
    return weatherData;
  } catch (error) {
    console.error("Weather API error:", error);
    return null;
  }
}

// Check if bad weather is expected
function checkBadWeather(weatherData: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split("T")[0];

  // Filter forecasts for tomorrow
  const tomorrowForecasts = weatherData.list.filter((forecast: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    return forecast.dt_txt.startsWith(tomorrowDate);
  });

  let maxRain = 0;
  let maxSnow = 0;
  let maxWind = 0;
  const conditions: string[] = [];

  for (const forecast of tomorrowForecasts) {
    // Check rain
    if (forecast.rain && forecast.rain["3h"]) {
      maxRain = Math.max(maxRain, forecast.rain["3h"]);
    }

    // Check snow
    if (forecast.snow && forecast.snow["3h"]) {
      maxSnow = Math.max(maxSnow, forecast.snow["3h"]);
    }

    // Check wind
    if (forecast.wind && forecast.wind.speed) {
      maxWind = Math.max(maxWind, forecast.wind.speed);
    }

    // Check weather conditions
    if (forecast.weather && forecast.weather[0]) {
      const condition = forecast.weather[0].main.toLowerCase();
      if (!conditions.includes(condition)) {
        conditions.push(condition);
      }
    }
  }

  // Thresholds for bad weather
  const isBad = maxRain > 2 || maxSnow > 0 || maxWind > 10 ||
                conditions.includes("thunderstorm") ||
                conditions.includes("snow");

  const weatherType = [];
  if (maxRain > 5) weatherType.push("heavy rain");
  else if (maxRain > 2) weatherType.push("rain");
  if (maxSnow > 0) weatherType.push("snow");
  if (maxWind > 15) weatherType.push("strong winds");
  else if (maxWind > 10) weatherType.push("wind");
  if (conditions.includes("thunderstorm")) weatherType.push("thunderstorms");

  return {
    isBad,
    type: weatherType.join(" and "),
    rain: maxRain,
    snow: maxSnow,
    wind: maxWind,
  };
}

// Send weather alert to customer
async function sendWeatherAlert(
  booking: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  customer: { full_name: string; email: string; phone: string },
  weather: { type: string; rain: number; snow: number; wind: number },
  supabase: any // eslint-disable-line @typescript-eslint/no-explicit-any
) {
  const moveDate = new Date(booking.move_date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  // EMAIL
  const emailSubject = `🌧️ Weather Alert: ${weather.type} expected tomorrow - ${booking.reference}`;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0 0 8px 0; font-size: 28px;">🌧️ Weather Alert</h1>
        <p style="color: #dbeafe; margin: 0; font-size: 16px;">We're prepared for tomorrow's weather</p>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>

        <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
          We've checked the weather forecast for your move tomorrow (${moveDate}), and <strong>${weather.type}</strong> is expected.
        </p>

        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #991b1b; font-size: 16px;">🌧️ Expected Weather:</p>
          <p style="margin: 0; color: #7f1d1d;">
            ${weather.rain > 0 ? `• Rain expected (up to ${weather.rain.toFixed(1)}mm)<br>` : ""}
            ${weather.snow > 0 ? `• Snow possible (up to ${weather.snow.toFixed(1)}mm)<br>` : ""}
            ${weather.wind > 0 ? `• Wind speeds up to ${weather.wind.toFixed(1)} m/s<br>` : ""}
          </p>
        </div>

        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #15803d; font-size: 16px;">✅ Don't Worry - We're Prepared!</p>
          <ul style="margin: 0; padding-left: 20px; color: #166534; line-height: 1.9;">
            <li>Our team is experienced in all weather conditions</li>
            <li>We'll protect your items with covers and blankets</li>
            <li>We'll take extra care on wet/slippery surfaces</li>
            <li>All furniture will be wrapped to stay dry</li>
            <li>The move will go ahead as planned</li>
          </ul>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #92400e; font-size: 16px;">💡 What You Can Do:</p>
          <ul style="margin: 0; padding-left: 20px; color: #78350f; line-height: 1.9;">
            <li>Have towels ready at both properties</li>
            <li>Clear pathways of any puddles/snow if possible</li>
            <li>Keep boxes away from doors to avoid water splash</li>
            <li>Have indoor space ready for items to be placed temporarily</li>
            <li>Wear appropriate footwear</li>
          </ul>
        </div>

        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 12px 0; font-size: 16px; color: #1e40af; font-weight: bold;">Need to Reschedule?</p>
          <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
            If you'd prefer to reschedule due to the weather, call us ASAP:<br>
            <a href="tel:07344683477" style="color: #1e40af; font-weight: bold; font-size: 16px;">07344 683477</a>
          </p>
          <p style="margin: 12px 0 0 0; color: #64748b; font-size: 12px;">
            (We understand weather concerns and will accommodate where possible)
          </p>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          We've moved in all weather conditions - you're in safe hands!<br>
          <strong style="color: #6b21a8;">The Ample Removals Team</strong>
        </p>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
          Booking Reference: ${booking.reference}
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
    console.log(`✅ Weather alert email sent to ${customer.email}`);
  } catch (emailErr) {
    console.error(`❌ Email failed:`, emailErr);
  }

  // SMS
  const smsBody = `🌧️ WEATHER ALERT (${moveDate}): ${weather.type} expected tomorrow. Don't worry - we're prepared! We'll protect your items. Need to reschedule? Call 07344683477. ${booking.reference}`;

  try {
    await sendSMS(customer.phone, smsBody);
    console.log(`✅ SMS sent to ${customer.phone}`);
  } catch (smsErr) {
    console.error(`❌ SMS failed:`, smsErr);
  }

  // WhatsApp
  const whatsappBody = `🌧️ *Weather Alert*\n\nHi ${customer.full_name},\n\nMove day: ${moveDate}\n\n*Weather Expected:*\n${weather.type}\n\n*Don't Worry!*\n✅ We're experienced in all weather\n✅ Items will be protected\n✅ Move goes ahead as planned\n\n*Your Prep:*\n• Have towels ready\n• Clear pathways\n• Keep boxes away from doors\n\n*Need to reschedule?*\nCall: *07344 683477*\n\nBooking: ${booking.reference}`;

  try {
    await sendWhatsApp(customer.phone, whatsappBody);
    console.log(`✅ WhatsApp sent to ${customer.phone}`);
  } catch (whatsappErr) {
    console.error(`❌ WhatsApp failed:`, whatsappErr);
  }

  // Mark alert as sent
  await supabase
    .from("bookings")
    .update({
      weather_alert_sent_at: new Date().toISOString(),
      weather_alert_type: weather.type,
    })
    .eq("id", booking.id);

  // Log activity
  await supabase.from("activity_log").insert({
    booking_id: booking.id,
    action: `Weather alert sent: ${weather.type}`,
    metadata: { weather_type: weather.type, rain: weather.rain, snow: weather.snow, wind: weather.wind },
    performed_by: "system",
  });
}
