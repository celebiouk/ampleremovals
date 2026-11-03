import { ThatchamHeader, ThatchamFooter } from "./ThatchamChrome";
import { ThatchamHome } from "./ThatchamHome";
import type { BrandTheme } from "@/components/local/multibrand/themes/types";
import "./thatcham.css";

/** Inner-page hero: paper, a navy plate for the section name, rooftops behind. */
function ThatchamPageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <section className="relative overflow-hidden border-b-[6px] border-[var(--th-navy)]">
      <div className="th-roofs pointer-events-none absolute inset-x-0 bottom-0" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-5xl px-5 pb-24 pt-14 md:px-8 md:pt-20">
        <span className="th-plate inline-block rounded-[6px] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-white">{eyebrow}</span>
        <h1 className="th-display mt-6 max-w-3xl break-words text-[clamp(2.2rem,5vw,4.2rem)] text-[var(--th-navy)]">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--th-ink-soft)] md:text-xl">{intro}</p>}
      </div>
    </section>
  );
}

export const thatchamTheme: BrandTheme = {
  rootClass: "th-root",
  vars: {},
  sticky: { callColor: "#1e3a5f", barBackground: "#f6efdf", barBorder: "rgba(30,58,95,0.25)", footerFill: "#1e3a5f" },
  Header: ThatchamHeader,
  Footer: ThatchamFooter,
  Home: ThatchamHome,
  PageHero: ThatchamPageHero,
  ui: {
    section: "mx-auto w-full max-w-5xl px-5 py-16 md:px-8 md:py-24",
    sectionAlt: "bg-[var(--th-paper-lift)] border-y border-[var(--th-line)]",
    h2: "th-display text-[clamp(1.8rem,3.4vw,2.8rem)] text-[var(--th-navy)] break-words",
    prose: "space-y-5 text-[1.08rem] leading-[1.85] text-[var(--th-ink-soft)]",
    card: "th-note relative rounded-[6px] p-6 border-t-4 border-t-[var(--th-amber)]",
    cardTitle: "th-display text-xl !leading-snug text-[var(--th-navy)]",
    cardBody: "mt-2 text-[15px] leading-relaxed text-[var(--th-ink-soft)]",
    icon: "text-[var(--th-amber)]",
    link: "text-sm font-bold text-[var(--th-navy)] underline decoration-[var(--th-amber)] decoration-2 underline-offset-4",
    meta: "text-xs text-[var(--th-ink-soft)]",
    ctaPanel: "rounded-[10px] bg-[var(--th-navy)] p-8 text-center text-white",
  },
};
