/**
 * GET /api/admin/bookings/[id]/incidents — access/damage-risk incidents for a
 * booking, with photo/signature storage paths resolved to fresh signed URLs
 * (the driver-documents bucket is private, so paths alone aren't viewable —
 * same pattern as evidence-pack/route.ts's photo counting).
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "driver-documents";
const SIGNED_URL_TTL = 60 * 60; // 1 hour — long enough to view the page, resolved fresh each load

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data: incidents, error } = await supabase
    .from("job_incidents")
    .select("id, description, photo_paths, signer_name, signature_path, created_at, driver:drivers(first_name, preferred_name)")
    .eq("booking_id", params.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const storage = supabase.storage.from(BUCKET);
  const resolved = await Promise.all(
    (incidents ?? []).map(async (inc) => {
      const driver = Array.isArray(inc.driver) ? inc.driver[0] : inc.driver;
      const [photoUrls, sigUrl] = await Promise.all([
        Promise.all((inc.photo_paths ?? []).map(async (p: string) => {
          const { data } = await storage.createSignedUrl(p, SIGNED_URL_TTL);
          return data?.signedUrl ?? null;
        })),
        storage.createSignedUrl(inc.signature_path, SIGNED_URL_TTL).then((r) => r.data?.signedUrl ?? null),
      ]);
      return {
        id: inc.id,
        description: inc.description,
        signerName: inc.signer_name,
        driverName: driver ? (driver.preferred_name || driver.first_name) : null,
        createdAt: inc.created_at,
        photoUrls: photoUrls.filter((u): u is string => !!u),
        signatureUrl: sigUrl,
      };
    })
  );

  return NextResponse.json({ success: true, incidents: resolved });
}
