/**
 * GET /api/worker/payslips/[id]/pdf — download payslip PDF for authenticated worker
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Get current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Determine if user is a driver or cleaner
    const { data: driver } = await supabase
      .from("drivers")
      .select("id, first_name, last_name")
      .eq("user_id", userId)
      .single();

    const { data: cleaner } = await supabase
      .from("cleaners")
      .select("id, first_name, last_name")
      .eq("user_id", userId)
      .single();

    if (!driver && !cleaner) {
      return NextResponse.json(
        { success: false, error: "Not a driver or cleaner" },
        { status: 403 }
      );
    }

    const worker = driver || cleaner;
    const workerId = worker!.id;
    const workerType = driver ? "driver" : "cleaner";

    // Get the specific payslip (ensuring it belongs to this worker)
    const { data: payslip, error } = await supabase
      .from("payslips")
      .select(
        `
        id,
        gross_earnings,
        tips_total,
        adjustments_total,
        net_pay,
        status,
        paid_at,
        pay_runs(reference, period_start, period_end)
      `
      )
      .eq("id", params.id)
      .eq("worker_type", workerType)
      .eq("worker_id", workerId)
      .single();

    if (!payslip) {
      return NextResponse.json(
        { success: false, error: "Payslip not found" },
        { status: 404 }
      );
    }

    // Generate simple text-based PDF
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
endobj
4 0 obj
<< /Length 800 >>
stream
BT
/F1 24 Tf
50 750 Td
(PAYSLIP) Tj
0 -40 Td
/F1 12 Tf
(Reference: ${(payslip.pay_runs as any)?.reference || 'N/A'}) Tj
0 -20 Td
(Name: ${worker!.first_name} ${worker!.last_name}) Tj
0 -20 Td
(Status: ${payslip.status}) Tj
0 -40 Td
/F1 14 Tf
(PAYMENT SUMMARY) Tj
0 -25 Td
/F1 12 Tf
(Gross Earnings: £${(payslip.gross_earnings / 100).toFixed(2)}) Tj
0 -20 Td
(Tips: £${(payslip.tips_total / 100).toFixed(2)}) Tj
0 -20 Td
(Adjustments: £${(payslip.adjustments_total / 100).toFixed(2)}) Tj
0 -30 Td
/F1 16 Tf
(NET PAY: £${(payslip.net_pay / 100).toFixed(2)}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000280 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
1140
%%EOF`;

    return new Response(pdfContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="payslip-${params.id}.pdf"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
