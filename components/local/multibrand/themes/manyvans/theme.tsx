import { ManyVansHeader, ManyVansFooter } from "./ManyVansChrome";
import { ManyVansHome } from "./ManyVansHome";
import type { BrandTheme } from "@/components/local/multibrand/themes/types";
import "./manyvans.css";

/** Inner-page hero: red livery band with the same lettering and a road edge. */
function ManyVansPageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <section className="mv-grain relative overflow-hidden bg-[var(--mv-red)] text-white">
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
        <p className="mv-tab inline-block bg-[var(--mv-ink)] px-3 py-2 text-[11px]">{eyebrow}</p>
        <h1 className="mv-display mt-6 max-w-4xl break-words text-[clamp(2.3rem,6vw,5rem)]">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">{intro}</p>}
      </div>
      <div className="mv-road" aria-hidden="true" />
    </section>
  );
}

export const manyVansTheme: BrandTheme = {
  rootClass: "mv-root",
  vars: {},
  sticky: { callColor: "#14161b", barBackground: "#f3efe7", barBorder: "#14161b", footerFill: "#14161b" },
  Header: ManyVansHeader,
  Footer: ManyVansFooter,
  Home: ManyVansHome,
  PageHero: ManyVansPageHero,
  ui: {
    section: "mx-auto w-full max-w-5xl px-5 py-16 md:px-8 md:py-24",
    sectionAlt: "bg-[var(--mv-ink)] text-white",
    h2: "mv-display text-[clamp(1.8rem,3.4vw,2.8rem)] break-words",
    prose: "space-y-5 text-[1.06rem] leading-[1.8] text-[var(--mv-ink-soft)]",
    card: "border-[3px] border-[var(--mv-ink)] bg-[var(--mv-paper)] text-[var(--mv-ink)] p-6 shadow-[6px_6px_0_0_var(--mv-ink)]",
    cardTitle: "mv-display text-xl !leading-tight",
    cardBody: "mt-2 text-[15px] leading-relaxed text-[var(--mv-ink-soft)]",
    icon: "text-[var(--mv-red)]",
    link: "mv-tab text-[11px] text-[var(--mv-red)] hover:underline",
    meta: "text-xs text-[var(--mv-ink-soft)]",
    ctaPanel: "bg-[var(--mv-ink)] text-white p-8 text-center",
    ctaButton: "mv-tab bg-[var(--mv-red)] text-white text-xs",
  },
};
