/**
 * A friendly flat illustration for the Newbury hero: a removals van pulling
 * up beside a house, under a sun and drifting clouds, inside a shop-window
 * arch. Pure SVG in the brand palette; decorative only.
 */
export function NewburyHeroArt({ className }: { className?: string }) {
  return (
    <svg viewBox="-6 -6 452 532" className={className} role="img" aria-label="A removals van outside a house on a sunny day">
      <defs>
        <clipPath id="nb-arch">
          <path d="M0 220C0 98 98 0 220 0s220 98 220 220v300H0Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#nb-arch)">
        <rect width="440" height="520" fill="#e6f0e1" />
        {/* sun */}
        <circle cx="330" cy="130" r="46" fill="#fbbf24" />
        <circle cx="330" cy="130" r="64" fill="#fbbf24" opacity="0.2" />
        {/* clouds */}
        <g className="nb-cloud" fill="#fff">
          <ellipse cx="120" cy="120" rx="46" ry="16" />
          <ellipse cx="150" cy="108" rx="30" ry="16" />
          <ellipse cx="96" cy="110" rx="24" ry="13" />
        </g>
        <g className="nb-cloud" fill="#fff" opacity="0.85" style={{ animationDuration: "34s" }}>
          <ellipse cx="260" cy="206" rx="36" ry="12" />
          <ellipse cx="282" cy="198" rx="22" ry="12" />
        </g>
        {/* hills */}
        <path d="M-10 360C70 300 150 330 220 345s150-60 240-20V520H-10Z" fill="#cfe1c7" />
        <path d="M-10 410C90 372 170 400 250 398s150-30 210-6V520H-10Z" fill="#9cc58c" />
        {/* road */}
        <rect x="-10" y="430" width="460" height="100" fill="#17261c" />
        <path d="M0 478H440" stroke="#f3f8f1" strokeWidth="4" strokeDasharray="26 22" />

        {/* house */}
        <g>
          <rect x="262" y="262" width="136" height="130" rx="4" fill="#fffaf0" />
          <path d="M248 270 330 196l82 74Z" fill="#14532d" />
          <rect x="378" y="206" width="16" height="36" fill="#0c3a1f" />
          <rect x="304" y="320" width="42" height="72" rx="3" fill="#ca8a04" />
          <circle cx="338" cy="358" r="3" fill="#fffaf0" />
          <rect x="276" y="288" width="30" height="30" rx="3" fill="#bfe0f2" stroke="#14532d" strokeWidth="3" />
          <rect x="356" y="288" width="30" height="30" rx="3" fill="#bfe0f2" stroke="#14532d" strokeWidth="3" />
          <rect x="262" y="388" width="136" height="6" fill="#0c3a1f" opacity="0.18" />
        </g>

        {/* boxes by the door */}
        <rect x="226" y="372" width="30" height="24" rx="2" fill="#ca8a04" />
        <rect x="231" y="352" width="22" height="20" rx="2" fill="#fbbf24" />
      </g>

      {/* van (in front of the arch so it can overlap the frame) */}
      <g className="nb-van">
        <rect x="30" y="334" width="150" height="86" rx="10" fill="#fff" stroke="#14532d" strokeWidth="5" />
        <path d="M180 358h38c8 0 14 4 18 11l12 22c3 5 4 9 4 14v15h-72Z" fill="#14532d" />
        <path d="M192 368h24c4 0 7 2 9 5l8 14h-41Z" fill="#bfe0f2" />
        <rect x="50" y="356" width="100" height="14" rx="7" fill="#fbbf24" />
        <rect x="50" y="380" width="64" height="9" rx="4.5" fill="#cfe1c7" />
        <circle cx="76" cy="424" r="17" fill="#17261c" />
        <circle cx="76" cy="424" r="7" fill="#e6f0e1" />
        <circle cx="206" cy="424" r="17" fill="#17261c" />
        <circle cx="206" cy="424" r="7" fill="#e6f0e1" />
      </g>

      {/* arch frame */}
      <path d="M0 220C0 98 98 0 220 0s220 98 220 220v300H0Z" fill="none" stroke="#14532d" strokeWidth="8" />
    </svg>
  );
}
