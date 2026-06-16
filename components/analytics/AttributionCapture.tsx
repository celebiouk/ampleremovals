"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/** Records first-touch marketing attribution on landing. Renders nothing. */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
