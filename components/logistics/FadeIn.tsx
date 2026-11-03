"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/shared/Reveal";

/** Scroll reveal used across Ample Logistics' pages. Content is visible by
 *  default and only animates in after hydration — see components/shared/Reveal. */
export function FadeIn({
  children,
  delay = 0,
  y = 16,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Reveal delay={delay} y={y} className={className} style={style}>
      {children}
    </Reveal>
  );
}
