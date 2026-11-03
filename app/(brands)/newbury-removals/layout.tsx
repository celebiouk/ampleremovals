import { nbDisplay, nbBody } from "@/components/local/multibrand/themes/newbury/fonts";
import type { CSSProperties } from "react";

// Scope Newbury Removals' type to its own route group so other brands never
// download it. The CSS variables re-point Tailwind's font-display / font-sans.
export default function NewburyRemovalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${nbDisplay.variable} ${nbBody.variable}`}
      style={{ ["--font-display" as string]: "var(--font-nb-display)", ["--font-body" as string]: "var(--font-nb-body)" } as CSSProperties}
    >
      {children}
    </div>
  );
}
