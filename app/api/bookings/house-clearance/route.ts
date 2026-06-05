import { type NextRequest } from "next/server";
import { handleBookingRoute } from "@/lib/bookings/handleBookingRoute";
import { HouseClearanceFormSchema } from "@/lib/schemas/booking";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleBookingRoute(request, "house_clearance", HouseClearanceFormSchema);
}
