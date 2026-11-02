import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log-error";
import { generateLogisticsReference } from "@/lib/logistics";
import { sendDriverRequestNotification } from "@/lib/logistics-notifications";

export const runtime = "nodejs";

const RequestSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  contactPerson: z.string().trim().min(1, "Contact person is required"),
  businessEmail: z.string().trim().email("A valid business email is required"),
  phone: z.string().trim().min(5, "A valid phone number is required"),
  locationPostcode: z.string().trim().min(1, "Postcode is required"),
  businessType: z.string().trim().optional(),
  licenceCategory: z.string().trim().min(1, "Licence category is required"),
  driversRequired: z.coerce.number().int().min(1).max(50),
  startDate: z.string().trim().optional(),
  assignmentDuration: z.string().trim().optional(),
  shiftType: z.string().trim().optional(),
  workingHours: z.string().trim().optional(),
  vehicleType: z.string().trim().optional(),
  jobLocation: z.string().trim().min(1, "Job location is required"),
  urgency: z.enum(["immediate", "within_24_hours", "within_7_days", "planned_future_requirement"]),
  additionalInfo: z.string().trim().optional(),
  privacyAccepted: z.literal(true, { message: "Please confirm you have read the Privacy Notice" }),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid submission" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const supabase = createAdminClient();
  const reference = generateLogisticsReference();

  const { data: inserted, error } = await supabase
    .from("logistics_driver_requests")
    .insert({
      reference,
      company_name: data.companyName,
      contact_person: data.contactPerson,
      business_email: data.businessEmail.toLowerCase(),
      phone: data.phone,
      location_postcode: data.locationPostcode,
      business_type: data.businessType || null,
      licence_category: data.licenceCategory,
      drivers_required: data.driversRequired,
      start_date: data.startDate || null,
      assignment_duration: data.assignmentDuration || null,
      shift_type: data.shiftType || null,
      working_hours: data.workingHours || null,
      vehicle_type: data.vehicleType || null,
      job_location: data.jobLocation,
      urgency: data.urgency,
      additional_info: data.additionalInfo || null,
      status: "new_request",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    await logError({ message: `logistics driver-request insert failed: ${error?.message}`, metadata: { reference } });
    return NextResponse.json({ success: false, error: "We couldn't submit your request right now. Please call us instead." }, { status: 500 });
  }

  // Confirmation is returned to the visitor immediately — email notification
  // is best-effort and never blocks or fails the submission itself.
  sendDriverRequestNotification({
    reference,
    companyName: data.companyName,
    contactPerson: data.contactPerson,
    businessEmail: data.businessEmail,
    phone: data.phone,
    jobLocation: data.jobLocation,
    driversRequired: data.driversRequired,
    licenceCategory: data.licenceCategory,
    startDate: data.startDate,
    assignmentDuration: data.assignmentDuration,
    shiftType: data.shiftType,
    urgency: data.urgency,
    additionalInfo: data.additionalInfo,
    dashboardId: inserted.id,
  })
    .then(() => supabase.from("logistics_driver_requests").update({ notified_at: new Date().toISOString() }).eq("id", inserted.id))
    .catch((e) => console.warn("driver-request notification failed:", e));

  return NextResponse.json({ success: true, reference });
}
