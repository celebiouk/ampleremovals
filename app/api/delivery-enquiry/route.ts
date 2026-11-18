import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import { logError } from "@/lib/log-error";
import { isExcludedBusiness, scoreDeliveryLead, DELIVERY_LEADS, type DeliveryLeadCategory } from "@/lib/delivery-leads";

export const runtime = "nodejs";

const EnquirySchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required"),
  contactName: z.string().trim().min(1, "Your name is required"),
  email: z.string().trim().email("A valid email is required"),
  phone: z.string().trim().min(5, "A valid phone number is required"),
  category: z.enum([
    "furniture_retailer",
    "appliance_retailer",
    "office_furniture_supplier",
    "kitchen_bathroom_supplier",
    "courier",
    "logistics_partner",
    "warehouse_distributor",
    "ecommerce",
    "self_storage",
    "event_equipment_supplier",
    "other",
  ]),
  message: z.string().trim().min(10, "Please add a little detail about what you need"),
});

/**
 * POST /api/delivery-enquiry — public form on ampleremovals.com/logistics.
 * Inserts straight into the same delivery_leads CRM table the discovery/
 * outreach automation will use, so inbound and outbound prospects live in
 * one pipeline.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const parsed = EnquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid submission" }, { status: 400 });
  }
  const d = parsed.data;

  const { excluded, reason } = isExcludedBusiness(d.businessName, d.category);
  const { score, band } = scoreDeliveryLead({
    category: d.category as DeliveryLeadCategory,
    distanceMiles: null,
    hasEmail: true,
    hasWebsite: false,
    hasPhone: true,
    capacityCompatible: true,
  });

  const supabase = createAdminClient();
  const { error } = await supabase.from("delivery_leads").insert({
    business_name: d.businessName,
    category: d.category,
    email: d.email,
    phone: d.phone,
    source: "website_enquiry",
    score,
    band,
    excluded,
    excluded_reason: reason ?? null,
    status: excluded ? "not_interested" : "qualified",
    admin_notes: `Submitted via ampleremovals.com/logistics by ${d.contactName}:\n\n${d.message}`,
  });

  if (error) {
    await logError({ message: "Failed to save delivery enquiry", metadata: { error: error.message, businessName: d.businessName } });
    return NextResponse.json({ success: false, error: "Something went wrong. Please call us instead." }, { status: 500 });
  }

  try {
    await sendEmail({
      to: DELIVERY_LEADS.notifyEmail,
      subject: `New delivery partnership enquiry — ${d.businessName}`,
      html: `<p><strong>${d.businessName}</strong> (${d.category}) wants to talk about delivery/collection support.</p>
        <p>Contact: ${d.contactName} — ${d.email} — ${d.phone}</p>
        <p>${d.message.replace(/\n/g, "<br/>")}</p>`,
    });
  } catch (err) {
    await logError({ message: "Failed to send delivery enquiry notification email", metadata: { error: String(err) } });
  }

  return NextResponse.json({ success: true });
}
