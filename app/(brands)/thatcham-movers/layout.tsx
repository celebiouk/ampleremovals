import { thDisplay, thBody } from "@/components/local/multibrand/themes/thatcham/fonts";
import type { CSSProperties } from "react";

// Scope Thatcham Movers' type to its own route group so other brands never
// download it. The CSS variables re-point Tailwind's font-display / font-sans.
export default function ThatchamMoversLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${thDisplay.variable} ${thBody.variable}`}
      style={{ ["--font-display" as string]: "var(--font-th-display)", ["--font-body" as string]: "var(--font-th-body)" } as CSSProperties}
    >
      {children}
    </div>
  );
}
