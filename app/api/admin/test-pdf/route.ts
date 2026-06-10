import { NextResponse } from "next/server";
import { generateInvoicePDF } from "@/lib/pdf/generate-invoice-pdf";
import type { InvoicePDFData } from "@/types";

/**
 * GET /api/admin/test-pdf
 * Quick test endpoint to verify PDF generation works
 */
export async function GET() {
  try {
    console.log("🧪 Testing PDF generation...");

    const testData: InvoicePDFData = {
      invoiceNumber: "INV-2026-TEST",
      invoiceDate: "08/06/2026",
      dueDate: "15/06/2026",
      status: "draft",
      type: "deposit",
      companyName: "Ample Removals",
      companyAddress: "123 Test Street\nReading\nRG1 1AA",
      companyPhone: "03335772070",
      companyEmail: "hello@ampleremovals.com",
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      customerPhone: "07700900000",
      originAddress: "Test Origin Address",
      bookingReference: "RMV-2026-TEST",
      serviceType: "House Removals",
      moveDate: "20/06/2026",
      lineItems: [
        {
          description: "House removal from 3-bed property",
          quantity: 1,
          unit_price: 100,
          total: 100,
        },
      ],
      subtotal: 100,
      vatRate: 0,
      vatAmount: 0,
      total: 100,
      notes: "Test invoice for PDF generation",
    };

    console.log("📄 Generating test PDF...");
    const pdfBuffer = await generateInvoicePDF(testData);
    console.log("✅ Test PDF generated successfully! Size:", pdfBuffer.length, "bytes");

    // Return PDF as download
    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=test-invoice.pdf",
      },
    });
  } catch (error) {
    console.error("❌ Test PDF generation failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
