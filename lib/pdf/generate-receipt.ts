import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { ReceiptDocument, type ReceiptData } from "./ReceiptTemplate";

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (renderToBuffer as any)(React.createElement(ReceiptDocument, { data }));
}
