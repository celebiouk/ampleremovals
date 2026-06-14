import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Verifies the caller is an authenticated driver. Bearer-aware so the driver
 * mobile app (Authorization: Bearer <token>) and the web portal (cookies) both work.
 * Returns the driver row on success.
 */
export async function requireDriver(): Promise<
  | { ok: true; userId: string; driver: { id: string; first_name: string; preferred_name: string | null } }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const authHeader = (await headers()).get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const {
    data: { user },
  } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, first_name, preferred_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!driver) {
    return { ok: false, response: NextResponse.json({ success: false, error: "Not a driver" }, { status: 403 }) };
  }

  return { ok: true, userId: user.id, driver };
}

/** Confirm the driver is assigned to a booking. */
export async function driverAssignedTo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  bookingId: string,
  driverId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("booking_driver_assignments")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("driver_id", driverId)
    .maybeSingle();
  return !!data;
}
