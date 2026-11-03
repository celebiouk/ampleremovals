import Link from "next/link";
import { ArrowRight, ChevronDown, MapPin, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { ContactCtaRow } from "@/components/local/multibrand/ContactCtaRow";
import { brandHref } from "@/components/local/multibrand/brand-links";
import type { CSSProperties, ReactNode } from "react";
import type { Brand } from "@/lib/brands";
import type { BrandPageContent } from "@/components/local/multibrand/BrandPageShell";
import "./thatcham.css";

// On the navy closing band the primary button flips to amber (navy text, so
// contrast holds) and outlines go white.
const ON_NAVY: CSSProperties = {
  ["--cta-primary" as string]: "#f59e0b",
  ["--cta-primary-fg" as string]: "#13263f",
  ["--cta-outline" as string]: "rgba(255,255,255,0.75)",
  ["--cta-fg" as string]: "#fff",
};

const TILTS = ["-rotate-[1.6deg]", "rotate-[1.1deg]", "rotate-[0.8deg]", "-rotate-[1deg]"];

/** Wrap the town name in the headline with a hand-inked amber underline. */
function markTown(text: string, town: string): ReactNode {
  const i = text.indexOf(town);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="th-mark">{town}</span>
      {text.slice(i + town.length)}
    </>
  );
}

export function ThatchamHome({ brand, basePath, content }: { brand: Brand; basePath: string; content: BrandPageContent }) {
  const HeroAction = content.heroAction;
  const town = brand.address.town;

  return (
    <>
      {/* HERO — headline on paper, an enamel street plate and pinned notices */}
      <section className="relative overflow-hidden border-b-[6px] border-[var(--th-navy)]">
        <div className="th-roofs pointer-events-none absolute inset-x-0 bottom-0" aria-hidden="true" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 pb-24 pt-12 md:px-8 md:pt-20 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p className="th-caps text-[11px] text-[var(--th-amber-text)]">{content.eyebrow}</p>
            <h1 className="th-display mt-5 break-words text-[clamp(2.4rem,5.4vw,4.9rem)] text-[var(--th-navy)]">
              {markTown(content.h1, town)}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[var(--th-ink-soft)] md:text-xl">{content.subhead}</p>
            <div className="mt-9">
              <HeroAction />
            </div>
          </div>

          <aside className="lg:col-span-5" aria-label={`${brand.name} at a glance`}>
            <div className="th-plate mx-auto w-full max-w-md rounded-[16px] p-2">
              <div className="rounded-[11px] border-2 border-white/90 px-6 pb-5 pt-4 text-center text-white">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-[0.25em] text-white/75">
                  <span>{brand.address.postcode.split(" ")[0]}</span>
                  <span>{brand.address.line1.replace(/^\d+\s+/, "")}</span>
                </div>
                <p className="th-display mt-2 text-[clamp(2.6rem,6vw,3.8rem)] font-semibold">{town}</p>
                <p className="mt-1 text-[11px] font-bold tracking-[0.3em] text-[var(--th-amber-light)]">MOVERS · REMOVALS · MAN AND VAN</p>
              </div>
            </div>

            <ul className="mx-auto mt-9 grid max-w-md grid-cols-2 gap-4">
              {content.trustPoints.map((p, i) => (
                <li key={p} className={`th-note relative rounded-[6px] px-4 pb-4 pt-5 text-[15px] font-semibold leading-snug text-[var(--th-navy)] ${TILTS[i % TILTS.length]}`}>
                  <span className="th-pin" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* STORY — heading, then two columns of copy with a drop cap */}
      <section className="bg-[var(--th-paper-lift)] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <Reveal>
            <p className="th-caps text-[11px] text-[var(--th-amber-text)]">Our story</p>
            <h2 className="th-display mt-4 max-w-3xl break-words text-[clamp(2rem,4.4vw,3.8rem)] text-[var(--th-navy)]">{content.storyHeading}</h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-10 gap-x-14 text-[1.08rem] leading-[1.85] text-[var(--th-ink-soft)] md:columns-2">
            {content.storyParagraphs.map((p, i) => (
              <p key={i} className={`mb-6 break-inside-avoid-column ${i === 0 ? "th-dropcap" : ""}`}>{p}</p>
            ))}
          </Reveal>
          {content.storyVisual && (
            <div className="mt-12">
              <content.storyVisual />
            </div>
          )}
        </div>
      </section>

      {/* SERVICES — navy board with ledger rows and dotted leaders */}
      <section className="bg-[var(--th-navy)] px-5 py-20 text-white md:px-8 md:py-28">
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="th-caps text-[11px] text-[var(--th-amber-light)]">On the board</p>
            <h2 className="th-display mt-4 break-words text-[clamp(2rem,3.8vw,3.2rem)]">{content.servicesHeading}</h2>
          </div>
          <div className="lg:col-span-8">
            {content.services.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <Link href={brandHref(basePath, s.href)} className="th-row group flex items-start gap-5 py-7 md:gap-8">
                  <span className="th-display th-italic mt-1 text-3xl text-[var(--th-amber-light)]">{i + 1}.</span>
                  <span className="flex-1">
                    <span className="th-display block text-[clamp(1.5rem,2.6vw,2.2rem)]">{s.title}</span>
                    <span className="mt-2 block max-w-xl text-[15px] leading-relaxed text-white/75">{s.body}</span>
                  </span>
                  <ArrowRight className="mt-3 h-6 w-6 shrink-0 text-[var(--th-amber-light)] transition-transform group-hover:translate-x-1.5" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — numbered questions, serif voice */}
      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="th-caps text-[11px] text-[var(--th-amber-text)]">Asked at the door</p>
              <h2 className="th-display mt-4 break-words text-[clamp(1.9rem,3.4vw,2.8rem)] text-[var(--th-navy)]">{content.faqHeading}</h2>
              <p className="mt-5 text-[var(--th-ink-soft)]">
                Not here? Ring us on{" "}
                <a href={brand.phoneHref} className="font-bold text-[var(--th-navy)] underline decoration-[var(--th-amber)] decoration-2 underline-offset-4">{brand.phone}</a>.
              </p>
            </div>
          </div>
          <div className="th-faq lg:col-span-8">
            {content.faqs.map((f, i) => (
              <details key={f.q} className="border-b border-[var(--th-line)] first:border-t">
                <summary className="flex items-start gap-4 py-5">
                  <span className="th-display th-italic mt-0.5 w-8 shrink-0 text-xl text-[var(--th-amber-text)]">{i + 1}.</span>
                  <span className="th-display flex-1 text-[1.15rem] font-medium leading-snug text-[var(--th-navy)] md:text-[1.3rem]">{f.q}</span>
                  <ChevronDown className="th-chev mt-1 h-5 w-5 shrink-0 text-[var(--th-navy)]" />
                </summary>
                <p className="max-w-2xl pb-6 pl-12 pr-6 leading-relaxed text-[var(--th-ink-soft)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA — navy panel with the street plate echoed */}
      <section className="relative overflow-hidden bg-[var(--th-navy-deep)] px-5 py-20 text-white md:px-8 md:py-28" style={ON_NAVY}>
        <div className="th-roofs pointer-events-none absolute inset-x-0 bottom-0 opacity-60 [filter:invert(1)]" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-4xl text-center">
          <h2 className="th-display break-words text-[clamp(2.1rem,5vw,4rem)]">{content.ctaHeading}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">{content.ctaSub}</p>
          <ContactCtaRow
            quoteHref={content.quoteHref}
            whatsappMessage={content.whatsappMessage}
            whatsappNumber={brand.whatsappNumber}
            phone={brand.phone}
            phoneHref={brand.phoneHref}
            accent={brand.colors.accentLight}
            source={`${brand.slug}_bottom_cta`}
          />
          <ul className="mt-10 flex flex-col items-center justify-center gap-x-8 gap-y-2 pb-10 text-sm text-white/80 sm:flex-row">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {brand.address.line1}, {brand.address.town}, {brand.address.postcode}</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Fully insured on every job</li>
          </ul>
        </div>
      </section>
    </>
  );
}
