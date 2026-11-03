import { NewburyHeader, NewburyFooter } from "./NewburyChrome";
import { NewburyHome } from "./NewburyHome";
import type { BrandTheme } from "@/components/local/multibrand/themes/types";
import "./newbury.css";

/** Inner-page hero: framed, centred, with the silks band beneath. */
function NewburyPageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <section className="px-4 pt-5 md:px-8 md:pt-8">
      <div className="nb-frame mx-auto w-full max-w-6xl px-6 py-14 text-center md:px-14 md:py-20">
        <div className="nb-ornament mx-auto max-w-sm">
          <span className="nb-caps px-1 text-center">{eyebrow}</span>
        </div>
        <h1 className="nb-display mx-auto mt-7 max-w-3xl break-words text-[clamp(2.1rem,5vw,4.2rem)]">{title}</h1>
        {intro && <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-[var(--nb-ivory)]/85 md:text-xl">{intro}</p>}
      </div>
      <div className="nb-silks -mx-4 mt-5 md:-mx-8 md:mt-8" aria-hidden="true" />
    </section>
  );
}

export const newburyTheme: BrandTheme = {
  rootClass: "nb-root",
  vars: {},
  sticky: { callColor: "#f0c04a", barBackground: "#0a2915", barBorder: "rgba(240,192,74,0.38)", footerFill: "#0a2915" },
  Header: NewburyHeader,
  Footer: NewburyFooter,
  Home: NewburyHome,
  PageHero: NewburyPageHero,
  ui: {
    section: "mx-auto w-full max-w-5xl px-5 py-16 md:px-8 md:py-24",
    sectionAlt: "nb-light",
    h2: "nb-display text-[clamp(1.8rem,3.4vw,2.8rem)] break-words",
    prose: "space-y-5 text-[1.08rem] font-light leading-[1.85] text-[var(--nb-ivory)]/85",
    card: "nb-frame bg-[var(--nb-green-2)] p-8 text-[var(--nb-ivory)]",
    cardTitle: "nb-display text-xl !leading-snug text-[var(--nb-gold-lite)]",
    cardBody: "mt-2 text-[15px] font-light leading-relaxed text-[var(--nb-ivory)]/80",
    icon: "text-[var(--nb-gold-lite)]",
    link: "nb-caps text-[var(--nb-gold-lite)] hover:underline",
    meta: "text-xs text-[var(--nb-ivory)]/60",
    ctaPanel: "nb-frame bg-[var(--nb-green-2)] p-10 text-center text-[var(--nb-ivory)]",
  },
};
