import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { createBooking } from "@/lib/bookings/createBooking";
import { createServiceClient } from "@/lib/supabase/server";
import type { ServiceType } from "@/types";
import type { AnyBookingForm as FormData } from "@/lib/schemas/booking";

/**
 * Shared booking-submission handler: server-side Zod validation, persistence,
 * and error logging to `server_logs`. Returns { success, reference } on
 * success or { success, error } on failure.
 */
export async function handleBookingRoute(
  request: NextRequest,
  serviceType: ServiceType,
  schema: z.ZodTypeAny
) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Please check your details and try again.",
        },
        { status: 400 }
      );
    }

    const reference = await createBooking(serviceType, parsed.data as FormData);
    return NextResponse.json({ success: true, reference });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // Best-effort error log — never let logging break the response.
    try {
      const supabase = createServiceClient();
      await supabase.from("server_logs").insert({
        level: "error",
        message: `booking submission failed (${serviceType}): ${message}`,
        metadata: { serviceType },
      });
    } catch {
      /* swallow */
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "We couldn't submit your booking right now. Please try again or call us on 07344 683477.",
      },
      { status: 500 }
    );
  }
}
