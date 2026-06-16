/**
 * GET /api/admin/bookings/[id]/evidence-pack — downloads the job's chain-of-
 * custody evidence pack as a PDF.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { generateEvidencePackPDF } from "@/lib/pdf/generate-evidence-pack";
import { SERVICE_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { ServiceType } from "@/types";

export const runtime = "nodejs";

const PHOTO_BUCKET = "driver-documents";

async function countPhotos(supabase: ReturnType<typeof createAdminClient>, bookingId: string, leg: string): Promise<number> {
  try {
    const { data } = await supabase.storage.from(PHOTO_BUCKET).list(`jobs/${bookingId}/${leg}/photos`);
    return (data ?? []).filter((f) => f.id || f.name).length;
  } catch {
    return 0;
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data: b } = await supabase
    .from("bookings")
    .select(`*,
      customer:customers(full_name),
      origin:addresses!origin_address_id(line_1, city, postcode),
      destination:addresses!destination_address_id(line_1, city, postcode)`)
    .eq("id", params.id)
    .single();
  if (!b) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
  const origin = Array.isArray(b.origin) ? b.origin[0] : b.origin;
  const dest = Array.isArray(b.destination) ? b.destination[0] : b.destination;
  const fmtAddr = (a: { line_1?: string; city?: string; postcode?: string } | null) =>
    a ? [a.line_1, a.city, a.postcode].filter(Boolean).join(", ") : "—";

  // Crew names.
  const { data: assigns } = await supabase
    .from("booking_driver_assignments")
    .select("driver:drivers(first_name, last_name)")
    .eq("booking_id", params.id);
  const driverNames = (assigns ?? [])
    .map((a) => { const d = Array.isArray(a.driver) ? a.driver[0] : a.driver; return d ? `${d.first_name} ${d.last_name ?? ""}`.trim() : null; })
    .filter(Boolean).join(", ") || "—";

  const [pickupPhotos, deliveryPhotos] = await Promise.all([
    countPhotos(supabase, params.id, "pickup"),
    countPhotos(supabase, params.id, "delivery"),
  ]);

  const { data: settings } = await supabase.from("settings").select("company_name").eq("id", 1).single();

  const pdf = await generateEvidencePackPDF({
    reference: b.reference,
    serviceType: SERVICE_LABELS[b.service_type as ServiceType] ?? b.service_type,
    customerName: customer?.full_name ?? "Customer",
    date: b.move_date ? formatDate(b.move_date) : "—",
    companyName: settings?.company_name ?? "Ample Removals",
    driverNames,
    origin: fmtAddr(origin),
    destination: fmtAddr(dest),
    pickup: {
      confirmed: Boolean(b.pickup_confirmed),
      contactName: b.pickup_contact_name ?? null,
      comments: b.pickup_comments ?? null,
      at: b.pickup_confirmed_at ? formatDateTime(b.pickup_confirmed_at) : null,
      photoCount: pickupPhotos,
      hasSignature: Boolean(b.pickup_signature_url),
    },
    delivery: {
      confirmed: Boolean(b.delivery_confirmed),
      contactName: b.delivery_contact_name ?? null,
      comments: b.delivery_comments ?? null,
      at: b.delivery_confirmed_at ? formatDateTime(b.delivery_confirmed_at) : null,
      photoCount: deliveryPhotos,
      hasSignature: Boolean(b.delivery_signature_url),
    },
    completedAt: b.completed_at ? formatDateTime(b.completed_at) : null,
    rating: b.survey_rating ?? null,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="evidence-${b.reference}.pdf"`,
    },
  });
}
