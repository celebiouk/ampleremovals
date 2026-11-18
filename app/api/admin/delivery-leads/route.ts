import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isExcludedBusiness, scoreDeliveryLead, type DeliveryLead, type DeliveryLeadCategory } from "@/lib/delivery-leads";

export const runtime = "nodejs";

function mapRow(row: Record<string, unknown>): DeliveryLead {
  return {
    id: row.id as string,
    businessName: row.business_name as string,
    category: row.category as DeliveryLead["category"],
    website: (row.website as string) ?? null,
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    address: (row.address as string) ?? null,
    postcode: (row.postcode as string) ?? null,
    searchCentre: (row.search_centre as string) ?? null,
    distanceMiles: row.distance_miles != null ? Number(row.distance_miles) : null,
    source: row.source as string,
    discoveredAt: row.discovered_at as string,
    score: row.score as number,
    band: row.band as DeliveryLead["band"],
    estJobsPerWeek: (row.est_jobs_per_week as string) ?? null,
    deliveryFrequency: (row.delivery_frequency as string) ?? null,
    requiredVehicleType: (row.required_vehicle_type as string) ?? null,
    requiredStaffCount: (row.required_staff_count as string) ?? null,
    distancePerJob: (row.distance_per_job as string) ?? null,
    estTimePerJob: (row.est_time_per_job as string) ?? null,
    potentialContractValue: (row.potential_contract_value as string) ?? null,
    capacityCompatible: row.capacity_compatible as boolean,
    capacityNotes: (row.capacity_notes as string) ?? null,
    excluded: row.excluded as boolean,
    excludedReason: (row.excluded_reason as string) ?? null,
    status: row.status as DeliveryLead["status"],
    adminNotes: (row.admin_notes as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * GET /api/admin/delivery-leads?category=&band=&status=&q=
 * Lists prospects for the delivery-subcontracting CRM, excluded ones hidden
 * by default (they're kept in the table for audit/dedup, never shown or
 * contacted).
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const band = searchParams.get("band");
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const includeExcluded = searchParams.get("includeExcluded") === "true";

  const supabase = createAdminClient();
  let query = supabase.from("delivery_leads").select("*").order("score", { ascending: false }).limit(500);

  if (!includeExcluded) query = query.eq("excluded", false);
  if (category) query = query.eq("category", category);
  if (band) query = query.eq("band", band);
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("business_name", `%${q}%`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: "Couldn't load delivery leads." }, { status: 500 });
  }

  return NextResponse.json({ success: true, leads: (data ?? []).map(mapRow) });
}

const CreateSchema = z.object({
  businessName: z.string().trim().min(1),
  category: z.enum([
    "furniture_retailer",
    "appliance_retailer",
    "office_furniture_supplier",
    "kitchen_bathroom_supplier",
    "courier",
    "logistics_partner",
    "warehouse_distributor",
    "ecommerce",
    "self_storage",
    "event_equipment_supplier",
    "other",
  ]),
  website: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  postcode: z.string().trim().optional(),
  searchCentre: z.enum(["thatcham", "newbury"]).optional(),
  distanceMiles: z.number().optional(),
});

/** POST /api/admin/delivery-leads — manually add a prospect from the CRM UI. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid lead" }, { status: 400 });
  }
  const d = parsed.data;

  const { excluded, reason } = isExcludedBusiness(d.businessName, d.category);
  const { score, band } = scoreDeliveryLead({
    category: d.category as DeliveryLeadCategory,
    distanceMiles: d.distanceMiles ?? null,
    hasEmail: !!d.email,
    hasWebsite: !!d.website,
    hasPhone: !!d.phone,
    capacityCompatible: true,
  });

  const supabase = createAdminClient();
  const { error } = await supabase.from("delivery_leads").insert({
    business_name: d.businessName,
    category: d.category,
    website: d.website ?? null,
    email: d.email ?? null,
    phone: d.phone ?? null,
    address: d.address ?? null,
    postcode: d.postcode ?? null,
    search_centre: d.searchCentre ?? null,
    distance_miles: d.distanceMiles ?? null,
    source: "manual",
    score,
    band,
    excluded,
    excluded_reason: reason ?? null,
    status: excluded ? "not_interested" : "discovered",
  });

  if (error) {
    return NextResponse.json({ success: false, error: "Couldn't create lead." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
