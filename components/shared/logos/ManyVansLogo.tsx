import { cn } from "@/lib/utils";

/** Three overlapping van-front marks, fanned out — literally "many vans."
 *  Bold red + charcoal: energetic, action-oriented. */
export function ManyVansLogo({ className, variant = "color" }: { className?: string; variant?: "color" | "white" }) {
  const white = variant === "white";
  const primary = white ? "#ffffff" : "#dc2626";
  const dark = white ? "#ffffff" : "#1e293b";
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <svg width="44" height="42" viewBox="0 0 48 42" fill="none" aria-hidden="true">
        <rect x="4" y="16" width="16" height="14" rx="2.5" fill={dark} opacity="0.55" />
        <rect x="16" y="12" width="18" height="18" rx="2.5" fill={primary} opacity="0.8" />
        <rect x="28" y="16" width="16" height="14" rx="2.5" fill={dark} />
      </svg>
      <span className="font-display text-[1.5rem] font-extrabold leading-none tracking-tight">
        <span style={{ color: dark }}>Many</span>
        <span style={{ color: primary }}>Vans</span>
      </span>
    </span>
  );
}

export default ManyVansLogo;
