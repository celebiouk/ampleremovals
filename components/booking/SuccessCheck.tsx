"use client";

import { motion } from "framer-motion";

/** Animated green check — circle + tick draw in via stroke-dashoffset. */
export function SuccessCheck() {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-brand-green-50"
    >
      <svg width="56" height="56" viewBox="0 0 52 52" fill="none">
        <motion.circle
          cx="26"
          cy="26"
          r="23"
          stroke="#16a34a"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.path
          d="M16 27l7 7 13-14"
          stroke="#16a34a"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  );
}
