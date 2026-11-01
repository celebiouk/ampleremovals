import { cn } from "@/lib/utils";

/** A clean van side-profile. Racing green + gold — a quiet nod to Newbury
 *  Racecourse, premium and local. */
export function NewburyRemovalsLogo({ className, variant = "color" }: { className?: string; variant?: "color" | "white" }) {
  const white = variant === "white";
  const primary = white ? "#ffffff" : "#14532d";
  const accent = "#ca8a04";
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <svg width="46" height="42" viewBox="0 0 54 42" fill="none" aria-hidden="true">
        <path
          d="M4 28 V14 H30 L40 22 V28"
          stroke={primary}
          strokeWidth="3.5"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M30 14 V22 H40" stroke={primary} strokeWidth="3.5" strokeLinejoin="round" fill="none" />
        <circle cx="14" cy="29" r="4.5" fill={white ? "#ffffff" : "#14532d"} stroke={accent} strokeWidth="2" />
        <circle cx="34" cy="29" r="4.5" fill={white ? "#ffffff" : "#14532d"} stroke={accent} strokeWidth="2" />
        <path d="M2 28 H44" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[1.5rem] font-extrabold leading-none tracking-tight">
        <span style={{ color: primary }}>Newbury</span>{" "}
        <span style={{ color: accent }}>Removals</span>
      </span>
    </span>
  );
}

export default NewburyRemovalsLogo;
