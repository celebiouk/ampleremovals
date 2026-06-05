import { type NextRequest } from "next/server";
import { handleBookingRoute } from "@/lib/bookings/handleBookingRoute";
import { EndOfTenancyFormSchema } from "@/lib/schemas/booking";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleBookingRoute(request, "end_of_tenancy", EndOfTenancyFormSchema);
}
