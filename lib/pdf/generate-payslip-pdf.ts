import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { PayePayslipDocument, type PayePayslipData } from "./PayePayslipTemplate";

/** Renders a PAYE payslip to a PDF buffer (Node runtime only). */
export async function generatePayslipPDF(data: PayePayslipData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (renderToBuffer as any)(React.createElement(PayePayslipDocument, { data }));
  return Buffer.from(buffer as ArrayBuffer);
}
