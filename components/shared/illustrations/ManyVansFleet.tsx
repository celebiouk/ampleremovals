/**
 * A bold, flat-style illustration of a fleet of vans — used exclusively on
 * ManyVans marketing pages to visually back up the "any van you need" sales
 * promise. Pure SVG (no external image asset), so it's instant-loading,
 * infinitely crisp, and themeable to the brand's red/charcoal palette.
 */
export function ManyVansFleet({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  // "light" = for use on dark/coloured backgrounds (hero sections).
  // "dark"  = for use on white/slate backgrounds (story/about sections).
  const body1 = tone === "light" ? "#ffffff" : "#1e293b";
  const body2 = tone === "light" ? "#fecaca" : "#dc2626";
  const body3 = tone === "light" ? "#ffffff" : "#1e293b";
  const glass = tone === "light" ? "#991b1b" : "#cbd5e1";
  const wheel = tone === "light" ? "#1e293b" : "#0f172a";
  const groundLine = tone === "light" ? "rgba(255,255,255,0.25)" : "rgba(15,23,42,0.12)";

  return (
    <svg
      viewBox="0 0 640 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="A fleet of ManyVans removal vans, ready for any size of job"
    >
      {/* ground line */}
      <rect x="0" y="178" width="640" height="3" rx="1.5" fill={groundLine} />

      {/* speed lines, suggesting readiness/motion */}
      <rect x="0" y="60" width="54" height="5" rx="2.5" fill={groundLine} />
      <rect x="0" y="80" width="30" height="5" rx="2.5" fill={groundLine} />
      <rect x="0" y="100" width="42" height="5" rx="2.5" fill={groundLine} />

      {/* Van 1 — small (back-left) */}
      <g transform="translate(20,86)">
        <rect x="0" y="22" width="100" height="56" rx="10" fill={body1} />
        <path d="M70 0H100V22H30L70 0Z" fill={body1} />
        <rect x="76" y="6" width="20" height="16" rx="3" fill={glass} />
        <circle cx="24" cy="80" r="14" fill={wheel} />
        <circle cx="86" cy="80" r="14" fill={wheel} />
      </g>

      {/* Van 2 — largest (centre, hero of the fleet) */}
      <g transform="translate(190,46)">
        <rect x="0" y="34" width="190" height="96" rx="14" fill={body2} />
        <path d="M128 0H190V34H54L128 0Z" fill={body2} />
        <rect x="138" y="10" width="40" height="26" rx="4" fill={glass} />
        <rect x="14" y="52" width="100" height="6" rx="3" fill="rgba(0,0,0,0.08)" />
        <circle cx="42" cy="134" r="22" fill={wheel} />
        <circle cx="42" cy="134" r="8" fill="#94a3b8" />
        <circle cx="156" cy="134" r="22" fill={wheel} />
        <circle cx="156" cy="134" r="8" fill="#94a3b8" />
      </g>

      {/* Van 3 — medium (front-right) */}
      <g transform="translate(420,66)">
        <rect x="0" y="26" width="140" height="78" rx="12" fill={body3} />
        <path d="M94 0H140V26H40L94 0Z" fill={body3} />
        <rect x="104" y="8" width="28" height="18" rx="3" fill={glass} />
        <circle cx="32" cy="108" r="18" fill={wheel} />
        <circle cx="112" cy="108" r="18" fill={wheel} />
      </g>
    </svg>
  );
}
