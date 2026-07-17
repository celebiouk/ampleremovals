import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { generateBookingReference, normaliseUKPhone } from "@/lib/utils";
import { generateQuoteConfirmToken } from "@/lib/tokens";
import { sendLeadInvite } from "@/lib/lead-invite";

export const runtime = "nodejs";

/**
 * POST /api/admin/leads/create
 * Admin quick-creates a Removals lead from just name + email + phone, then fires
 * the tri-channel invite with a unique self-service completion link. The lead is
 * a partial booking (status "inquiry") the customer finishes themselves.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: { fullName?: string; email?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const fullName = body.fullName?.trim();
  const email = body.email?.trim().toLowerCase();
  const phoneRaw = body.phone?.trim();
  if (!fullName || !email || !phoneRaw) {
    return NextResponse.json({ success: false, error: "Name, email and phone are all required." }, { status: 400 });
  }
  const phone = normaliseUKPhone(phoneRaw);

  const supabase = createAdminClient();

  // 0. Dedup — if a pending lead already exists for this email OR phone, don't
  //    create a second one. Tell the admin it's already been added.
  const { data: matches } = await supabase
    .from("customers")
    .select("id")
    .or(`email.eq.${email},phone.eq.${phone}`);
  const matchIds = (matches ?? []).map((m) => m.id);
  if (matchIds.length) {
    const { data: existing } = await supabase
      .from("bookings")
      .select("id, reference")
      .in("customer_id", matchIds)
      .eq("is_partial_lead", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      const dupToken = generateQuoteConfirmToken(existing.id);
      const dupLink = dupToken ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/complete/${existing.id}/${dupToken}` : null;
      return NextResponse.json(
        { success: false, alreadyExists: true, error: "This lead has already been added.", bookingId: existing.id, reference: existing.reference, link: dupLink },
        { status: 409 }
      );
    }
  }

  // 1. Customer (upsert by unique email).
  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .upsert({ full_name: fullName, email, phone }, { onConflict: "email" })
    .select("id")
    .single();
  if (custErr || !customer) {
    return NextResponse.json({ success: false, error: "Couldn't save the customer." }, { status: 500 });
  }

  // 2. Partial lead booking — core columns only so it can't fail on an
  //    un-migrated column; is_partial_lead is set best-effort after.
  const reference = generateBookingReference("removals");
  const { data: booking, error: bookErr } = await supabase
    .from("bookings")
    .insert({
      reference,
      service_type: "removals",
      customer_id: customer.id,
      status: "inquiry",
      source: "admin_lead",
    })
    .select("id")
    .single();
  if (bookErr || !booking) {
    return NextResponse.json({ success: false, error: "Couldn't create the lead." }, { status: 500 });
  }
  const bookingId = booking.id as string;

  try {
    await supabase.from("bookings").update({ is_partial_lead: true }).eq("id", bookingId);
  } catch { /* column may not be migrated yet */ }

  // 3. Audit trail.
  await Promise.allSettled([
    supabase.from("status_history").insert({ booking_id: bookingId, previous_status: null, new_status: "inquiry", changed_by: "admin" }),
    supabase.from("activity_log").insert({
      booking_id: bookingId,
      customer_id: customer.id,
      action: "lead_created",
      metadata: { reference, source: "admin_lead" },
      performed_by: "admin",
    }),
  ]);

  // 4. Completion link + tri-channel invite.
  const token = generateQuoteConfirmToken(bookingId);
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Lead created but invite link couldn't be signed (QUOTE_CONFIRM_SECRET missing)." },
      { status: 500 }
    );
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${siteUrl}/complete/${bookingId}/${token}`;

  await sendLeadInvite({ firstName: fullName.split(" ")[0], email, phone, link });

  return NextResponse.json({ success: true, bookingId, reference, link });
}
