import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { QuoteDocument } from "./QuoteTemplate";
import type { QuotePDFData } from "@/types";

/**
 * Renders a quote to a PDF buffer using @react-pdf/renderer.
 * Runs in Node.js runtime only — marked via serverExternalPackages in next.config.mjs.
 */
export async function generateQuotePDF(data: QuotePDFData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (renderToBuffer as any)(React.createElement(QuoteDocument, { data }));
  return Buffer.from(buffer as ArrayBuffer);
}
