/**
 * Architectural hero artwork — an isometric stack of moving crates with a
 * green routing strap. Abstract and modern (not clipart). Purely decorative.
 */
export function HeroTruck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="crateA" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#a855f7" />
          <stop offset="1" stopColor="#6b21a8" />
        </linearGradient>
        <linearGradient id="crateB" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#c084fc" />
          <stop offset="1" stopColor="#7e22ce" />
        </linearGradient>
        <linearGradient id="crateTop" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#e9d5ff" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#4ade80" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="24" stdDeviation="26" floodColor="#1a0533" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* floating accent ring */}
      <circle cx="408" cy="120" r="54" stroke="url(#ring)" strokeWidth="10" opacity="0.9" />
      {/* small floating square */}
      <rect x="70" y="86" width="40" height="40" rx="8" fill="#22c55e" opacity="0.85" transform="rotate(-12 90 106)" />

      <g filter="url(#soft)">
        {/* base crate */}
        <g>
          <path d="M150 330l110-62 110 62-110 64z" fill="url(#crateTop)" />
          <path d="M150 330v92l110 64v-94z" fill="url(#crateA)" />
          <path d="M370 330v92l-110 64v-94z" fill="#581c87" />
          <path d="M260 396v94" stroke="#3b0764" strokeOpacity="0.4" strokeWidth="2" />
        </g>

        {/* middle crate (offset for asymmetry) */}
        <g transform="translate(8 -118)">
          <path d="M176 320l84-48 84 48-84 49z" fill="url(#crateTop)" />
          <path d="M176 320v70l84 49v-71z" fill="url(#crateB)" />
          <path d="M344 320v70l-84 49v-71z" fill="#6b21a8" />
        </g>

        {/* top crate with green strap */}
        <g transform="translate(-2 -224)">
          <path d="M198 312l62-36 62 36-62 37z" fill="url(#crateTop)" />
          <path d="M198 312v52l62 37v-53z" fill="url(#crateA)" />
          <path d="M322 312v52l-62 37v-53z" fill="#581c87" />
          {/* strap */}
          <path d="M260 276l-62 36v18l62-36 62 36v-18z" fill="url(#ring)" opacity="0.95" />
        </g>
      </g>

      {/* route dots */}
      <g fill="#4ade80">
        <circle cx="96" cy="430" r="6" />
        <circle cx="130" cy="452" r="5" opacity="0.7" />
        <circle cx="164" cy="470" r="4" opacity="0.5" />
      </g>
    </svg>
  );
}

export default HeroTruck;
