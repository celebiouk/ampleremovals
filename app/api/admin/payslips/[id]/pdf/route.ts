/**
 * GET /api/admin/payslips/[id]/pdf — render a payslip PDF
 * Uses @react-pdf/renderer
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

// TODO: Create PayslipPDF component
// For now, return a placeholder response that indicates the PDF route is ready

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    // Fetch payslip + worker + earnings + adjustments
    const { data: payslip, error } = await supabase
      .from("payslips")
      .select(
        `
        id,
        pay_run_id,
        worker_type,
        worker_id,
        gross_earnings,
        tips_total,
        adjustments_total,
        net_pay,
        status,
        paid_at,
        payment_method,
        created_at,
        pay_runs!inner(reference, period_start, period_end),
        payslip_earnings(
          earning_id,
          driver_earnings(
            booking_id,
            gross_earnings,
            tip_amount,
            booking_total
          )
        ),
        payroll_adjustments(type, label, amount)
      `
      )
      .eq("id", params.id)
      .single();

    if (error || !payslip) {
      throw new Error(`Failed to fetch payslip: ${error?.message}`);
    }

    // Fetch worker details
    const tableName = payslip.worker_type === "driver" ? "drivers" : "cleaners";
    const { data: worker, error: workerError } = await supabase
      .from(tableName)
      .select("id, first_name, last_name, email, phone")
      .eq("id", payslip.worker_id)
      .single();

    if (workerError || !worker) {
      throw new Error(
        `Failed to fetch ${tableName}: ${workerError?.message}`
      );
    }

    // Generate simple text-based PDF with payslip details
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
<< /Length 750 >>
stream
BT
/F1 24 Tf
50 750 Td
(PAYSLIP) Tj
0 -40 Td
/F1 12 Tf
(Reference: ${(payslip.pay_runs as any)?.reference || 'N/A'}) Tj
0 -20 Td
(Worker: ${worker.first_name} ${worker.last_name}) Tj
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
1090
%%EOF`;

    return new Response(pdfContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="payslip-${payslip.id}.pdf"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
