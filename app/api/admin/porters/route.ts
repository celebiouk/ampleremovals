/**
 * GET  /api/admin/porters — list porters (with job counts)
 * POST /api/admin/porters — create a porter
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();

  const { data: porters, error } = await supabase
    .from("porters")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Attach job counts.
  const { data: assigns } = await supabase.from("booking_porter_assignments").select("porter_id");
  const counts = new Map<string, number>();
  (assigns ?? []).forEach((a) => counts.set(a.porter_id, (counts.get(a.porter_id) ?? 0) + 1));

  return NextResponse.json({
    success: true,
    porters: (porters ?? []).map((p) => ({ ...p, job_count: counts.get(p.id) ?? 0 })),
  });
}

const createSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  default_day_rate: z.number().min(0).optional(),
  skills: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("porters").insert({
    ...parsed.data,
    email: parsed.data.email || null,
  }).select("id").single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, id: data.id });
}
