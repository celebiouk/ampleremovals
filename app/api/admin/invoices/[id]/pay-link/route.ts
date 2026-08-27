/**
 * POST /api/admin/invoices/[id]/pay-link
 * Returns the customer pay link for an invoice, attaching a short pay-code first
 * if it doesn't have one (older invoices predate auto pay-codes). The link opens
 * /pay/<code> — card payment + bank transfer. Works for any invoice, old or new.
 */
import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, pay_code, status")
    .eq("id", params.id)
    .maybeSingle();
  if (!invoice) return NextResponse.json({ success: false, error: "Invoice not found." }, { status: 404 });

  let payCode = invoice.pay_code as string | null;
  if (!payCode) {
    for (let i = 0; i < 10; i++) {
      const candidate = randomBytes(5).toString("hex");
      const { data: clash } = await supabase.from("invoices").select("id").eq("pay_code", candidate).maybeSingle();
      if (!clash) { payCode = candidate; break; }
    }
    if (!payCode) return NextResponse.json({ success: false, error: "Couldn't generate a pay code." }, { status: 500 });
    // Attach the code (and lift a draft to 'sent' — it's being handed to the customer).
    await supabase
      .from("invoices")
      .update({ pay_code: payCode, status: invoice.status === "draft" ? "sent" : invoice.status })
      .eq("id", params.id);
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ampleremovals.com";
  return NextResponse.json({ success: true, payCode, payLink: `${site}/pay/${payCode}` });
}
