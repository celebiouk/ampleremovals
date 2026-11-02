import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log-error";
import { generateLogisticsReference } from "@/lib/logistics";
import { sendDriverApplicationNotification } from "@/lib/logistics-notifications";
import { uploadLogisticsCV } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_CV_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_CV_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const ApplicationSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("A valid email is required"),
  phone: z.string().trim().min(5, "A valid phone number is required"),
  townCity: z.string().trim().min(1, "Town or city is required"),
  postcode: z.string().trim().min(1, "Postcode is required"),
  licenceCategory: z.string().trim().min(1, "Licence category is required"),
  experienceYears: z.string().trim().optional(),
  driverCpcStatus: z.string().trim().optional(),
  tachoCardStatus: z.string().trim().optional(),
  preferredWorkType: z.string().trim().optional(),
  preferredPattern: z.string().trim().optional(),
  availability: z.string().trim().optional(),
  preferredLocations: z.string().trim().optional(),
  experienceNotes: z.string().trim().optional(),
  additionalInfo: z.string().trim().optional(),
  privacyAccepted: z.coerce.boolean(),
});

export async function POST(req: NextRequest) {
  let formData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const raw: Record<string, string> = {};
  for (const key of [
    "fullName", "email", "phone", "townCity", "postcode", "licenceCategory",
    "experienceYears", "driverCpcStatus", "tachoCardStatus", "preferredWorkType",
    "preferredPattern", "availability", "preferredLocations", "experienceNotes",
    "additionalInfo", "privacyAccepted",
  ]) {
    const value = formData.get(key);
    if (typeof value === "string") raw[key] = value;
  }

  const parsed = ApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid submission" },
      { status: 400 }
    );
  }
  if (!parsed.data.privacyAccepted) {
    return NextResponse.json({ success: false, error: "Please confirm you have read the Privacy Notice" }, { status: 400 });
  }
  const data = parsed.data;

  const cvFile = formData.get("cv");
  if (cvFile instanceof File && cvFile.size > 0) {
    if (cvFile.size > MAX_CV_SIZE) {
      return NextResponse.json({ success: false, error: "CV file must be under 5MB" }, { status: 400 });
    }
    if (!ALLOWED_CV_TYPES.includes(cvFile.type)) {
      return NextResponse.json({ success: false, error: "CV must be a PDF or Word document" }, { status: 400 });
    }
  }

  const supabase = createAdminClient();
  const reference = generateLogisticsReference();

  let cvPath: string | null = null;
  if (cvFile instanceof File && cvFile.size > 0) {
    try {
      cvPath = await uploadLogisticsCV(reference, cvFile);
    } catch (e) {
      await logError({ message: `logistics CV upload failed: ${e instanceof Error ? e.message : String(e)}`, metadata: { reference } });
      // Don't fail the whole application over a CV upload issue — the
      // applicant can always send it separately.
    }
  }

  const { data: inserted, error } = await supabase
    .from("logistics_driver_applications")
    .insert({
      reference,
      full_name: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      town_city: data.townCity,
      postcode: data.postcode,
      licence_category: data.licenceCategory,
      experience_years: data.experienceYears || null,
      driver_cpc_status: data.driverCpcStatus || null,
      tacho_card_status: data.tachoCardStatus || null,
      preferred_work_type: data.preferredWorkType || null,
      preferred_pattern: data.preferredPattern || null,
      availability: data.availability || null,
      preferred_locations: data.preferredLocations || null,
      experience_notes: data.experienceNotes || null,
      additional_info: data.additionalInfo || null,
      cv_path: cvPath,
      status: "new_application",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    await logError({ message: `logistics driver-application insert failed: ${error?.message}`, metadata: { reference } });
    return NextResponse.json({ success: false, error: "We couldn't submit your application right now. Please try again." }, { status: 500 });
  }

  sendDriverApplicationNotification({
    reference,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    townCity: data.townCity,
    postcode: data.postcode,
    licenceCategory: data.licenceCategory,
    experienceYears: data.experienceYears,
    driverCpcStatus: data.driverCpcStatus,
    tachoCardStatus: data.tachoCardStatus,
    preferredWorkType: data.preferredWorkType,
    preferredPattern: data.preferredPattern,
    availability: data.availability,
    preferredLocations: data.preferredLocations,
    hasCV: Boolean(cvPath),
    dashboardId: inserted.id,
  })
    .then(() => supabase.from("logistics_driver_applications").update({ notified_at: new Date().toISOString() }).eq("id", inserted.id))
    .catch((e) => console.warn("driver-application notification failed:", e));

  return NextResponse.json({ success: true, reference });
}
