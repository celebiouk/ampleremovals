import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getInvoiceSignedURL } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const invoiceId = params.id;
  const supabase = createAdminClient();

  const { data: invoice } = await supabase.from("invoices").select("booking_id").eq("id", invoiceId).single();
  if (!invoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });

  try {
    const url = await getInvoiceSignedURL(invoice.booking_id, invoiceId, 3600);
    return NextResponse.json({ success: true, url });
  } catch {
    return NextResponse.json({ success: false, error: "PDF not found" }, { status: 404 });
  }
}
