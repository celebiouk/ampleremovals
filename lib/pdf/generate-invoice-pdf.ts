import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { InvoiceDocument } from "./InvoiceTemplate";
import type { InvoicePDFData } from "@/types";

/**
 * Renders an invoice to a PDF buffer using @react-pdf/renderer.
 * Must run in a Node.js runtime (not Edge).
 */
export async function generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
  const element = React.createElement(InvoiceDocument, { data });
  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}
