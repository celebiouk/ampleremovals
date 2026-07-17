import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { generateQuoteConfirmToken } from "@/lib/tokens";

export const runtime = "nodejs";

export interface PendingLead {
  id: string;
  reference: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  reminderStage: number;
  lastReminderAt: string | null;
  link: string | null;
}

/**
 * GET /api/admin/leads
 * Pending New Leads — bookings the team created that the customer hasn't
 * completed yet (is_partial_lead = true). Shown under the New Lead form.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, reference, created_at, lead_reminder_stage, lead_last_reminder_at, customer:customers!inner(full_name, email, phone)")
    .eq("is_partial_lead", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ success: false, error: "Couldn't load leads." }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const leads: PendingLead[] = (data ?? []).map((b) => {
    const c = Array.isArray(b.customer) ? b.customer[0] : b.customer;
    const token = generateQuoteConfirmToken(b.id);
    return {
      id: b.id,
      reference: b.reference,
      fullName: c?.full_name ?? null,
      email: c?.email ?? null,
      phone: c?.phone ?? null,
      createdAt: b.created_at,
      reminderStage: b.lead_reminder_stage ?? 0,
      lastReminderAt: b.lead_last_reminder_at ?? null,
      link: token ? `${siteUrl}/complete/${b.id}/${token}` : null,
    };
  });

  return NextResponse.json({ success: true, leads });
}
