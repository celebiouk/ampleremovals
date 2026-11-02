import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/resend";
import { logError } from "@/lib/log-error";
import { LOGISTICS } from "@/lib/logistics";

export const runtime = "nodejs";

const ContactSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("A valid email is required"),
  phone: z.string().trim().optional(),
  enquiryType: z.enum(["business_staffing", "driver_registration", "existing_assignment", "general"]),
  subject: z.string().trim().min(1, "Subject is required"),
  message: z.string().trim().min(10, "Please add a little more detail"),
  privacyAccepted: z.literal(true, { message: "Please confirm you have read the Privacy Notice" }),
});

const ENQUIRY_LABELS: Record<string, string> = {
  business_staffing: "Business Staffing Enquiry",
  driver_registration: "Driver Registration",
  existing_assignment: "Existing Assignment",
  general: "General Enquiry",
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid submission" }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const { error } = await sendEmail({
      to: LOGISTICS.notifyEmail,
      from: `${LOGISTICS.emailFrom} <${LOGISTICS.emailAddress}>`,
      subject: `${ENQUIRY_LABELS[data.enquiryType]} — ${data.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: ${LOGISTICS.colors.charcoal}; max-width: 600px; margin: 0 auto;">
          <div style="background: ${LOGISTICS.colors.navy}; padding: 24px; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">New Website Enquiry</h1>
          </div>
          <div style="background: #fff; padding: 28px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 10px 10px;">
            <p><strong>Type:</strong> ${ENQUIRY_LABELS[data.enquiryType]}</p>
            <p><strong>Name:</strong> ${data.fullName}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
            ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p style="margin-top:16px; white-space: pre-wrap;">${data.message}</p>
          </div>
        </div>`,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    await logError({ message: `logistics contact email failed: ${e instanceof Error ? e.message : String(e)}` });
    return NextResponse.json({ success: false, error: "We couldn't send your message right now. Please call us instead." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
