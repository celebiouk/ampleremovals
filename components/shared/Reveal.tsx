"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Scroll-triggered reveal that is progressive enhancement, not a gate.
 *
 * The server renders the content fully visible, so crawlers, no-JS visitors,
 * reduced-motion users and print all see everything. Only after hydration, and
 * only for blocks that start below the fold, do we hide them and fade them in
 * as they scroll into view. (The old framer-motion `initial={{opacity:0}}`
 * approach left whole sections blank until JS ran.)
 */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  style,
}: {
  children: ReactNode;
  /** Seconds. */
  delay?: number;
  /** Starting translateY in px. */
  y?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already on screen at load: leave it alone rather than flashing it out and in.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setPhase("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const motion: CSSProperties =
    phase === "hidden"
      ? { opacity: 0, transform: `translateY(${y}px)` }
      : phase === "shown"
        ? { opacity: 1, transform: "none", transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s` }
        : {};

  return (
    <div ref={ref} className={className} style={{ ...style, ...motion }}>
      {children}
    </div>
  );
}
