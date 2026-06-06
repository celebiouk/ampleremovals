import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { twilioClient, twilioFrom } from "@/lib/twilio";
import { normaliseUKPhone } from "@/lib/utils";
import { renderTemplate } from "@/lib/automation-templates";
import { logError } from "@/lib/log-error";

/**
 * GET /api/cron/automations
 * Called by Vercel Cron every 5 minutes.
 * Secured with CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  let executed = 0, skipped = 0, failed = 0;

  try {
    // Fetch all active rules
    const { data: rules } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("is_active", true);

    if (!rules?.length) return NextResponse.json({ executed: 0, skipped: 0, failed: 0 });

    // Fetch company settings for template variables
    const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
    const companyPhone = settings?.company_phone ?? "07344 683477";
    const googleReviewLink = settings?.google_review_link ?? "[Google Review Link]";

    for (const rule of rules) {
      try {
        if (rule.trigger_event === "booking_created") {
          await processBookingCreatedRule(rule, supabase, companyPhone, googleReviewLink, { executed, skipped, failed });
        } else if (rule.trigger_event === "move_date_tomorrow") {
          await processDayBeforeRule(rule, supabase, companyPhone, { executed, skipped, failed });
        }
        // Status-based triggers are handled in the status update route
      } catch (err) {
        failed++;
        await logError({ message: `Automation rule ${rule.id} failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { ruleId: rule.id } });
      }
    }
  } catch (err) {
    await logError({ message: `Cron automations fatal error: ${err instanceof Error ? err.message : String(err)}` });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ executed, skipped, failed });
}

async function processBookingCreatedRule(
  rule: Record<string, unknown>,
  supabase: ReturnType<typeof createAdminClient>,
  companyPhone: string,
  googleReviewLink: string,
  counts: { executed: number; skipped: number; failed: number }
) {
  const delayMs = (rule.delay_minutes as number) * 60 * 1000;
  const cutoff = new Date(Date.now() - delayMs);

  // Find bookings created before the cutoff that haven't been processed
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, reference, service_type, created_at, customers!inner(full_name, email, phone), origin_addr:addresses!origin_address_id(postcode)")
    .eq("status", "inquiry")
    .lte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  for (const b of (bookings ?? [])) {
    const customer = (Array.isArray(b.customers) ? b.customers[0] : b.customers) as { full_name: string; email: string; phone: string } | null;
    if (!customer) continue;

    // Check if already processed
    const { count } = await supabase
      .from("automation_logs")
      .select("*", { count: "exact", head: true })
      .eq("rule_id", rule.id as string)
      .eq("booking_id", b.id as string);

    if ((count ?? 0) > 0) { counts.skipped++; continue; }

    const vars = {
      name: customer.full_name,
      service: b.service_type as string,
      ref: b.reference as string,
      company_phone: companyPhone,
      google_review_link: googleReviewLink,
    };

    let status: "sent" | "failed" = "sent";
    let errorMsg: string | undefined;

    try {
      if (rule.action_type === "sms" || rule.action_type === "both") {
        if (twilioClient && customer.phone) {
          const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE;
          if (adminPhone) {
            const msg = `⚠️ Uncontacted lead: ${customer.full_name} — ${b.service_type} ${b.reference}. Call now: ${customer.phone}`;
            await twilioClient.messages.create({ from: twilioFrom, to: normaliseUKPhone(adminPhone), body: msg.slice(0, 160) });
          }
        }
      }
      if (rule.action_type === "email" || rule.action_type === "both") {
        // Send confirmation email
        await resend.emails.send({
          from: resendFrom,
          to: customer.email,
          subject: renderTemplate("We've received your {{service}} request — Ref: {{ref}}", vars),
          html: `<p>Hi ${customer.full_name},</p><p>We've received your ${b.service_type} request (Ref: ${b.reference}).</p>`,
        });
      }
      counts.executed++;
    } catch (e) {
      status = "failed";
      errorMsg = e instanceof Error ? e.message : String(e);
      counts.failed++;
    }

    await supabase.from("automation_logs").insert({
      rule_id: rule.id as string,
      booking_id: b.id as string,
      customer_id: null,
      executed_at: new Date().toISOString(),
      status,
      error_message: errorMsg ?? null,
    });
  }
}

async function processDayBeforeRule(
  rule: Record<string, unknown>,
  supabase: ReturnType<typeof createAdminClient>,
  companyPhone: string,
  counts: { executed: number; skipped: number; failed: number }
) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, reference, service_type, move_date, customers!inner(full_name, email, phone)")
    .eq("move_date", tomorrowStr)
    .in("status", ["deposit_paid_job_confirmed", "full_balance_paid"])
    .limit(50);

  for (const b of (bookings ?? [])) {
    const customer = (Array.isArray(b.customers) ? b.customers[0] : b.customers) as { full_name: string; email: string; phone: string } | null;
    if (!customer) continue;

    const { count } = await supabase
      .from("automation_logs")
      .select("*", { count: "exact", head: true })
      .eq("rule_id", rule.id as string)
      .eq("booking_id", b.id as string);

    if ((count ?? 0) > 0) { counts.skipped++; continue; }

    let status: "sent" | "failed" = "sent";
    let errorMsg: string | undefined;
    try {
      const vars = { name: customer.full_name, service: b.service_type as string, ref: b.reference as string, date: tomorrowStr, company_phone: companyPhone };

      if (twilioClient && customer.phone) {
        const msg = renderTemplate("Hi {{name}}, reminder: your {{service}} is tomorrow. Our team will call to confirm arrival. – Ample Removals", vars);
        await twilioClient.messages.create({ from: twilioFrom, to: normaliseUKPhone(customer.phone), body: msg.slice(0, 160) });
      }

      await resend.emails.send({
        from: resendFrom,
        to: customer.email,
        subject: renderTemplate("Reminder: Your {{service}} is tomorrow — Ref: {{ref}}", vars),
        html: `<p>Hi ${customer.full_name},</p><p>Your ${b.service_type} is scheduled for tomorrow, ${tomorrowStr}. Please call us on ${companyPhone} if you need anything.</p>`,
      });
      counts.executed++;
    } catch (e) {
      status = "failed"; errorMsg = e instanceof Error ? e.message : String(e); counts.failed++;
    }

    await supabase.from("automation_logs").insert({
      rule_id: rule.id as string, booking_id: b.id as string,
      executed_at: new Date().toISOString(), status, error_message: errorMsg ?? null,
    });
  }
}
