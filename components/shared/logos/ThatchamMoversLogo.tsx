import { cn } from "@/lib/utils";

/** House outline with a motion line through it — "moving home," literally.
 *  Navy + amber: authoritative, local, heritage-feeling. */
export function ThatchamMoversLogo({ className, variant = "color" }: { className?: string; variant?: "color" | "white" }) {
  const white = variant === "white";
  const primary = white ? "#ffffff" : "#1e3a5f";
  const accent = "#d97706";
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <svg width="42" height="42" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M8 24 L24 10 L40 24" stroke={primary} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 21 V40 H36 V21" stroke={primary} strokeWidth="3.5" strokeLinejoin="round" />
        <rect x="20" y="28" width="8" height="12" fill={primary} />
        <path d="M6 33 H18 M30 33 H42" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[1.5rem] font-extrabold leading-none tracking-tight">
        <span style={{ color: primary }}>Thatcham</span>{" "}
        <span style={{ color: accent }}>Movers</span>
      </span>
    </span>
  );
}

export default ThatchamMoversLogo;
