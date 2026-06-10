import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Animates a number from 0 to `target` on mount / when the target changes.
 * Eases out for a satisfying "tick up" like a banking app. Respects Reduce
 * Motion (jumps straight to the value).
 */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const reduced = useReducedMotion();
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (reduced || target === 0) { setValue(target); return; }
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(target * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else setValue(target);
    };
    frame.current = requestAnimationFrame(tick);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [target, duration, reduced]);

  return value;
}
