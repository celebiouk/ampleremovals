import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { DRIVER_APPLICATION_STATUSES } from "@/lib/logistics";
import { getLogisticsCVSignedURL } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("logistics_driver_applications")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });

  let cvSignedUrl: string | null = null;
  if (data.cv_path) {
    try {
      cvSignedUrl = await getLogisticsCVSignedURL(data.cv_path);
    } catch {
      // Signed URL generation failing shouldn't block viewing the application.
    }
  }

  return NextResponse.json({ success: true, application: data, cvSignedUrl });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null) as { status?: string; adminNotes?: string } | null;
  if (!body) return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });

  const update: Record<string, string> = { updated_at: new Date().toISOString() };
  if (body.status) {
    if (!DRIVER_APPLICATION_STATUSES.includes(body.status as never)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body.adminNotes !== undefined) update.admin_notes = body.adminNotes;

  const supabase = createAdminClient();
  const { error } = await supabase.from("logistics_driver_applications").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ success: false, error: "Couldn't update the application." }, { status: 500 });

  return NextResponse.json({ success: true });
}
