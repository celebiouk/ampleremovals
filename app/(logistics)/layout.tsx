import { Big_Shoulders_Display, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import { LogisticsHeader, LogisticsFooter } from "@/components/logistics/LogisticsChrome";

// Ample Logistics gets its own type system, distinct from both Ample
// Removals (Bricolage Grotesque/Plus Jakarta Sans) and the white-label
// brands — condensed industrial display type + a monospace data face for
// route/licence/reference tags, befitting a haulage despatch operation
// rather than a consumer moving-quote site. Scoped to this route group
// only, by overriding the --font-display/--font-body CSS variables that
// Tailwind's font-display/font-sans utilities already read (see
// tailwind.config.ts) — every existing font-display/font-sans class in
// the Logistics pages picks this up automatically, no className changes
// needed anywhere else.
const display = Big_Shoulders_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-logistics-display",
  display: "swap",
});

const body = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-logistics-body",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-logistics-mono",
  display: "swap",
});

/**
 * Ample Logistics' own site chrome — separate from both the removals
 * (public) layout and the white-label (brands) layout, since this is a
 * different business line entirely. See tasks/brand-playbook.md.
 */
export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} flex min-h-screen flex-col bg-white`}
      style={{
        "--font-display": "var(--font-logistics-display)",
        "--font-body": "var(--font-logistics-body)",
        fontFamily: "var(--font-logistics-body)",
      } as React.CSSProperties}
    >
      <LogisticsHeader />
      <main className="flex-1">{children}</main>
      <LogisticsFooter />
    </div>
  );
}
