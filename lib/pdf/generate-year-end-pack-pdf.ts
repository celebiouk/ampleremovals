import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { YearEndPackDocument, type YearEndPackData } from "./YearEndPackTemplate";

/** Renders the accountant year-end pack to a PDF buffer (Node runtime only). */
export async function generateYearEndPackPDF(data: YearEndPackData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (renderToBuffer as any)(React.createElement(YearEndPackDocument, { data }));
  return Buffer.from(buffer as ArrayBuffer);
}
