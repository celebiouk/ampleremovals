import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { EvidencePackDocument, type EvidencePackData } from "./EvidencePackTemplate";

export async function generateEvidencePackPDF(data: EvidencePackData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (renderToBuffer as any)(React.createElement(EvidencePackDocument, { data }));
}
