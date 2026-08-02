import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { PaymentReceiptDocument, type PaymentReceiptData } from "./PaymentReceiptTemplate";

/**
 * Renders a payment receipt to a PDF buffer using @react-pdf/renderer.
 * Runs in Node.js runtime only (see serverExternalPackages in next.config.mjs).
 */
export async function generatePaymentReceiptPDF(data: PaymentReceiptData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (renderToBuffer as any)(React.createElement(PaymentReceiptDocument, { data }));
  return Buffer.from(buffer as ArrayBuffer);
}
