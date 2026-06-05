import { type NextRequest } from "next/server";
import { handleBookingRoute } from "@/lib/bookings/handleBookingRoute";
import { RemovalsFormSchema } from "@/lib/schemas/booking";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleBookingRoute(request, "removals", RemovalsFormSchema);
}
