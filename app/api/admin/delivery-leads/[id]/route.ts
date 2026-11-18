import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const UpdateSchema = z.object({
  status: z
    .enum([
      "discovered",
      "qualified",
      "queued",
      "contacted",
      "followed_up",
      "interested",
      "pricing_requested",
      "not_interested",
      "unsubscribed",
      "converted",
    ])
    .optional(),
  adminNotes: z.string().optional(),
  capacityNotes: z.string().optional(),
  estJobsPerWeek: z.string().optional(),
  deliveryFrequency: z.string().optional(),
  requiredVehicleType: z.string().optional(),
  requiredStaffCount: z.string().optional(),
  distancePerJob: z.string().optional(),
  estTimePerJob: z.string().optional(),
  potentialContractValue: z.string().optional(),
  capacityCompatible: z.boolean().optional(),
});

/** GET /api/admin/delivery-leads/[id] — lead detail + its email thread + follow-ups. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const supabase = createAdminClient();
  const [{ data: lead, error: leadError }, { data: thread }, { data: followups }] = await Promise.all([
    supabase.from("delivery_leads").select("*").eq("id", id).single(),
    supabase.from("delivery_lead_email_threads").select("*").eq("lead_id", id).order("created_at", { ascending: true }),
    supabase.from("delivery_lead_followups").select("*").eq("lead_id", id).order("sequence_step", { ascending: true }),
  ]);

  if (leadError || !lead) {
    return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, lead, thread: thread ?? [], followups: followups ?? [] });
}

/** PATCH /api/admin/delivery-leads/[id] — manual status override / notes, from the CRM detail view. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid update" }, { status: 400 });
  }

  const data = parsed.data;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.status !== undefined) update.status = data.status;
  if (data.adminNotes !== undefined) update.admin_notes = data.adminNotes;
  if (data.capacityNotes !== undefined) update.capacity_notes = data.capacityNotes;
  if (data.estJobsPerWeek !== undefined) update.est_jobs_per_week = data.estJobsPerWeek;
  if (data.deliveryFrequency !== undefined) update.delivery_frequency = data.deliveryFrequency;
  if (data.requiredVehicleType !== undefined) update.required_vehicle_type = data.requiredVehicleType;
  if (data.requiredStaffCount !== undefined) update.required_staff_count = data.requiredStaffCount;
  if (data.distancePerJob !== undefined) update.distance_per_job = data.distancePerJob;
  if (data.estTimePerJob !== undefined) update.est_time_per_job = data.estTimePerJob;
  if (data.potentialContractValue !== undefined) update.potential_contract_value = data.potentialContractValue;
  if (data.capacityCompatible !== undefined) update.capacity_compatible = data.capacityCompatible;

  const supabase = createAdminClient();
  const { error } = await supabase.from("delivery_leads").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ success: false, error: "Couldn't update lead." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
