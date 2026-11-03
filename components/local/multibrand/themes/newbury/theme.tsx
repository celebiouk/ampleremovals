import { NewburyHeader, NewburyFooter } from "./NewburyChrome";
import { NewburyHome } from "./NewburyHome";
import type { BrandTheme } from "@/components/local/multibrand/themes/types";
import "./newbury.css";

/** Inner-page hero: sage band, friendly headline, a pill for the section name. */
function NewburyPageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <section className="nb-sage">
      <div className="mx-auto w-full max-w-5xl px-5 pb-16 pt-16 md:px-8 md:pb-20 md:pt-20">
        <span className="inline-block rounded-full border border-[var(--nb-sage-200)] bg-white px-4 py-1.5 text-sm font-bold text-[var(--nb-green)]">{eyebrow}</span>
        <h1 className="nb-display mt-6 max-w-3xl break-words text-[clamp(2.2rem,5vw,4.2rem)] text-[var(--nb-green-deep)]">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--nb-ink-soft)] md:text-xl">{intro}</p>}
      </div>
    </section>
  );
}

export const newburyTheme: BrandTheme = {
  rootClass: "nb-root",
  vars: {},
  sticky: { callColor: "#14532d", barBackground: "#ffffff", barBorder: "#cfe1c7", footerFill: "#ffffff" },
  Header: NewburyHeader,
  Footer: NewburyFooter,
  Home: NewburyHome,
  PageHero: NewburyPageHero,
  ui: {
    section: "mx-auto w-full max-w-5xl px-5 py-16 md:px-8 md:py-24",
    sectionAlt: "nb-sage",
    h2: "nb-display text-[clamp(1.8rem,3.4vw,2.8rem)] text-[var(--nb-green-deep)] break-words",
    prose: "space-y-5 text-[1.08rem] leading-[1.8] text-[var(--nb-ink-soft)]",
    card: "nb-card p-7",
    cardTitle: "nb-display text-xl !leading-snug text-[var(--nb-green-deep)]",
    cardBody: "mt-2 text-[15px] leading-relaxed text-[var(--nb-ink-soft)]",
    icon: "text-[var(--nb-green)]",
    link: "text-sm font-bold text-[var(--nb-green)] hover:underline",
    meta: "text-xs text-[var(--nb-ink-soft)]",
    ctaPanel: "rounded-[2rem] bg-[var(--nb-green)] p-10 text-center text-white",
    ctaButton: "rounded-full bg-[var(--nb-gold-lite)] text-[var(--nb-green-deep)]",
  },
};
