import { type NextRequest } from "next/server";
import { handleBookingRoute } from "@/lib/bookings/handleBookingRoute";
import { ManAndVanFormSchema } from "@/lib/schemas/booking";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleBookingRoute(request, "man_and_van", ManAndVanFormSchema);
}
