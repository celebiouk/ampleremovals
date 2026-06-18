/**
 * POST /api/admin/leads/backfill-scores — compute lead_score/lead_band for
 * existing bookings that don't have one yet (e.g. created before the migration).
 * Safe to re-run. Requires the lead_score/lead_band columns to exist.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { computeLeadScore } from "@/lib/lead-scoring";
import { detectIntent } from "@/lib/lead-signals";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();

  // Bookings missing a score. If the column doesn't exist this query errors —
  // surface a clear message telling the admin to run the migration first.
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, customer_id, service_type, move_date, flexible_date_from, is_flexible_date, description, source, destination_address_id, created_at, customers!inner(email, phone)")
    .is("lead_score", null)
    .limit(2000);
  if (error) {
    return NextResponse.json({ success: false, error: "Run add_lead_scoring.sql first (lead_score column missing).", detail: error.message }, { status: 400 });
  }

  // Returning-customer lookup: how many bookings each customer has.
  const counts = new Map<string, number>();
  const custIds = [...new Set((bookings ?? []).map((b) => b.customer_id).filter(Boolean))];
  if (custIds.length > 0) {
    const { data: allForCusts } = await supabase.from("bookings").select("customer_id").in("customer_id", custIds);
    for (const r of allForCusts ?? []) counts.set(r.customer_id, (counts.get(r.customer_id) ?? 0) + 1);
  }

  let updated = 0;
  for (const b of bookings ?? []) {
    const customer = Array.isArray(b.customers) ? b.customers[0] : b.customers;
    const destinationRequired = b.service_type === "removals" || b.service_type === "man_and_van";
    const lead = computeLeadScore({
      moveDate: b.move_date ?? b.flexible_date_from ?? null,
      hasEmail: Boolean(customer?.email),
      hasPhone: Boolean(customer?.phone),
      hasOrigin: true,
      hasDestination: Boolean(b.destination_address_id),
      destinationRequired,
      bedrooms: null, // not joined in backfill; uses the service default
      serviceType: b.service_type,
      source: b.source,
      createdAt: b.created_at ? new Date(b.created_at) : undefined,
      returningCustomer: (counts.get(b.customer_id) ?? 0) > 1,
      intent: detectIntent(b.description).level,
    });
    const { error: upErr } = await supabase.from("bookings").update({ lead_score: lead.score, lead_band: lead.band }).eq("id", b.id);
    if (!upErr) updated++;
  }

  return NextResponse.json({ success: true, scanned: bookings?.length ?? 0, updated });
}
