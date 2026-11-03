"use client";

import { useEffect, useState } from "react";
import { LOGISTICS } from "@/lib/logistics";

// A schematic of the Berkshire coverage network, drawn like a motorway
// diagram rather than a real map: the M4 corridor as the spine, a handful of
// coverage towns as junction nodes, a truck running the route. Positions are
// illustrative only (the caption says so); the town list comes from the
// proposed coverage towns in lib/logistics.ts.
const M4 = "M36 330 L116 296 L176 268 L292 222 L404 170 L500 128 L588 96";

const NODES: { name: string; x: number; y: number; dx: number; dy: number; anchor?: "start" | "end" | "middle" }[] = [
  { name: "Hungerford", x: 36, y: 330, dx: 0, dy: 24, anchor: "start" },
  { name: "Newbury", x: 116, y: 296, dx: 0, dy: 26, anchor: "middle" },
  { name: "Thatcham", x: 176, y: 268, dx: 0, dy: -16, anchor: "middle" },
  { name: "Reading", x: 292, y: 222, dx: 0, dy: -18, anchor: "middle" },
  { name: "Maidenhead", x: 404, y: 170, dx: 0, dy: -18, anchor: "middle" },
  { name: "Slough", x: 500, y: 128, dx: 0, dy: -18, anchor: "middle" },
  { name: "Wokingham", x: 380, y: 296, dx: 0, dy: 26, anchor: "middle" },
  { name: "Bracknell", x: 462, y: 262, dx: 0, dy: 26, anchor: "middle" },
  { name: "Windsor", x: 548, y: 196, dx: 0, dy: 26, anchor: "middle" },
];

const A_ROADS = ["M292 222 L380 296 L462 262 L548 196", "M404 170 L548 196", "M500 128 L548 196"];

export function RouteMap({ className }: { className?: string }) {
  // SMIL motion can't be switched off from CSS, so honour reduced-motion here.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const green = LOGISTICS.colors.blue;

  return (
    <svg
      viewBox="0 0 620 400"
      className={className}
      role="img"
      aria-label="Schematic of the M4 corridor through Berkshire, linking coverage towns from Hungerford and Newbury to Slough and Windsor"
    >
      <defs>
        <pattern id="lg-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        </pattern>
        <filter id="lg-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="620" height="400" fill="url(#lg-grid)" />

      {/* secondary roads */}
      {A_ROADS.map((d) => (
        <path key={d} d={d} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" />
      ))}

      {/* M4 spine: green carriageway with a white centre dash */}
      <path d={M4} fill="none" stroke={green} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d={M4} fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="8 8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />

      <text x="596" y="82" textAnchor="end" fontSize="11" fontWeight="700" letterSpacing="2" fill="rgba(255,255,255,0.6)" style={{ fontFamily: "var(--font-logistics-mono)" }}>
        TO LONDON
      </text>
      <g transform="translate(222 262) rotate(-26)">
        <rect x="-22" y="-10" width="44" height="20" rx="3" fill="#1d4ed8" stroke="#fff" strokeWidth="1.5" />
        <text x="0" y="5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" style={{ fontFamily: "var(--font-logistics-mono)" }}>M4</text>
      </g>

      {/* junction nodes */}
      {NODES.map((n) => (
        <g key={n.name}>
          <circle cx={n.x} cy={n.y} r="7.5" fill={LOGISTICS.colors.ink} stroke="#fff" strokeWidth="2.5" />
          <text
            x={n.x + n.dx}
            y={n.y + n.dy}
            textAnchor={n.anchor ?? "middle"}
            fontSize="11"
            fontWeight="600"
            letterSpacing="1.4"
            fill="rgba(255,255,255,0.92)"
            style={{ fontFamily: "var(--font-logistics-mono)", textTransform: "uppercase" }}
          >
            {n.name}
          </text>
        </g>
      ))}

      {/* the truck: a simple cab-and-box silhouette driven along the M4 */}
      <g filter="url(#lg-glow)" transform={reduced ? "translate(292 222) rotate(-22)" : undefined}>
        <g transform="translate(-14 -9)">
          <rect x="0" y="0" width="20" height="14" rx="2" fill="#fff" />
          <path d="M21 3h6l4 5v6H21z" fill={LOGISTICS.colors.amber} />
          <circle cx="7" cy="15" r="3" fill={LOGISTICS.colors.ink} stroke="#fff" strokeWidth="1.2" />
          <circle cx="25" cy="15" r="3" fill={LOGISTICS.colors.ink} stroke="#fff" strokeWidth="1.2" />
        </g>
        {!reduced && <animateMotion dur="18s" repeatCount="indefinite" rotate="auto" path={M4} />}
      </g>
    </svg>
  );
}
