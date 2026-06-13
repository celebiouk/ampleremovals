import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { YearEndStatementDocument, type YearEndPDFData } from "./YearEndStatementTemplate";

/**
 * Renders a worker's year-end statement (P45-style) to a PDF buffer.
 * Node.js runtime only.
 */
export async function generateYearEndPDF(data: YearEndPDFData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (renderToBuffer as any)(
    React.createElement(YearEndStatementDocument, { data })
  );
  return Buffer.from(buffer as ArrayBuffer);
}
