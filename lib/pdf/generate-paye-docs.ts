import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { P60Document, P45Document, type P60Data, type P45Data } from "./PayeYearEndDocs";

export async function generateP60PDF(data: P60Data): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (renderToBuffer as any)(React.createElement(P60Document, { data }));
  return Buffer.from(buffer as ArrayBuffer);
}

export async function generateP45PDF(data: P45Data): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (renderToBuffer as any)(React.createElement(P45Document, { data }));
  return Buffer.from(buffer as ArrayBuffer);
}
