import { type NextRequest } from "next/server";
import { handleBookingRoute } from "@/lib/bookings/handleBookingRoute";
import { HouseCleaningFormSchema } from "@/lib/schemas/booking";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleBookingRoute(request, "house_cleaning", HouseCleaningFormSchema);
}
