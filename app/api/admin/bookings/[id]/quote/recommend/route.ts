/**
 * GET /api/admin/bookings/[id]/quote/recommend — deterministic suggested price
 * from distance + size + services. The admin can accept or tweak it.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { calculateDistance } from "@/lib/postcode";
import { recommendQuote } from "@/lib/quote-recommendation";

const DETAIL_TABLE: Record<string, string> = {
  removals: "removals_details",
  house_clearance: "house_clearance_details",
  house_cleaning: "house_cleaning_details",
  end_of_tenancy: "end_of_tenancy_details",
  man_and_van: "man_and_van_details",
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(`service_type,
      origin:addresses!origin_address_id(postcode),
      destination:addresses!destination_address_id(postcode)`)
    .eq("id", params.id)
    .single();
  if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

  const svc = booking.service_type as string;
  const origin = (Array.isArray(booking.origin) ? booking.origin[0] : booking.origin) as { postcode?: string } | null;
  const dest = (Array.isArray(booking.destination) ? booking.destination[0] : booking.destination) as { postcode?: string } | null;

  // Distance (origin → destination) where both exist.
  let distanceMiles: number | null = null;
  if (origin?.postcode && dest?.postcode) {
    distanceMiles = await calculateDistance(origin.postcode, dest.postcode);
  }

  // Size + van type from the service detail table.
  let bedrooms: string | null = null;
  let vanType: string | null = null;
  const detailTable = DETAIL_TABLE[svc];
  if (detailTable) {
    const { data: detail } = await supabase.from(detailTable).select("*").eq("booking_id", params.id).maybeSingle();
    bedrooms = (detail?.bedrooms as string) ?? null;
    vanType = (detail?.van_type as string) ?? null;
  }

  const { data: extras } = await supabase
    .from("additional_services")
    .select("packing_services, packing_materials, disassemble_furniture, assemble_furniture")
    .eq("booking_id", params.id)
    .maybeSingle();

  const recommendation = recommendQuote({
    serviceType: svc,
    bedrooms,
    distanceMiles,
    vanType,
    additionalServices: extras ?? null,
  });

  return NextResponse.json({ success: true, recommendation, distanceMiles });
}
