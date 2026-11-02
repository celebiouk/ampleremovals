"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Consistent scroll-triggered reveal used across Ample Logistics' pages. */
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
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
