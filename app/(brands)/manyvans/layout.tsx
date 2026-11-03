import { mvDisplay, mvBody } from "@/components/local/multibrand/themes/manyvans/fonts";
import type { CSSProperties } from "react";

// Scope ManyVans' type to its own route group so the other brands never
// download it. The CSS variables re-point Tailwind's font-display / font-sans.
export default function ManyVansLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${mvDisplay.variable} ${mvBody.variable}`}
      style={{ ["--font-display" as string]: "var(--font-mv-display)", ["--font-body" as string]: "var(--font-mv-body)" } as CSSProperties}
    >
      {children}
    </div>
  );
}
