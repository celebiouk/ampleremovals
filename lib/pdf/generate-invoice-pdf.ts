import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { InvoiceDocument } from "./InvoiceTemplate";
import type { InvoicePDFData } from "@/types";

/**
 * Renders an invoice to a PDF buffer using @react-pdf/renderer.
 * Runs in Node.js runtime only — marked via serverExternalPackages in next.config.mjs.
 */
export async function generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (renderToBuffer as any)(React.createElement(InvoiceDocument, { data }));
  return Buffer.from(buffer as ArrayBuffer);
}
