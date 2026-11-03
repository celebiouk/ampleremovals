import Link from "next/link";
import { ArrowRight, MapPin, Plus, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { ContactCtaRow } from "@/components/local/multibrand/ContactCtaRow";
import { brandHref } from "@/components/local/multibrand/brand-links";
import type { ReactNode } from "react";
import type { Brand } from "@/lib/brands";
import type { BrandPageContent } from "@/components/local/multibrand/BrandPageShell";
import "./newbury.css";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

/** Set the town name in gold italics, the way a racecard prints a winner. */
function goldTown(text: string, town: string): ReactNode {
  const i = text.indexOf(town);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="nb-italic nb-gold">{town}</span>
      {text.slice(i + town.length)}
    </>
  );
}

function Ornament() {
  return (
    <div className="nb-ornament mx-auto my-8 max-w-xs" aria-hidden="true">
      <span className="text-sm">◆</span>
    </div>
  );
}

export function NewburyHome({ brand, basePath, content }: { brand: Brand; basePath: string; content: BrandPageContent }) {
  const HeroAction = content.heroAction;
  const [lead, ...rest] = content.storyParagraphs;

  return (
    <>
      {/* HERO — a framed, centred enclosure plaque with the racecard beneath */}
      <section className="px-4 pb-0 pt-5 md:px-8 md:pt-8">
        <div className="nb-frame mx-auto w-full max-w-6xl">
          <div className="px-6 pb-12 pt-14 text-center md:px-14 md:pt-20">
            <div className="nb-ornament mx-auto max-w-md">
              <span className="nb-caps px-1 text-center">{content.eyebrow}</span>
            </div>
            <h1 className="nb-display mx-auto mt-8 max-w-4xl break-words text-[clamp(2.3rem,5.8vw,5.2rem)]">
              {goldTown(content.h1, brand.address.town)}
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg font-light leading-relaxed text-[var(--nb-ivory)]/85 md:text-xl">{content.subhead}</p>
            <div className="nb-hero-actions mt-10">
              <HeroAction />
            </div>
          </div>

          {/* The racecard: one numbered column per promise */}
          <ul className="grid border-t border-[var(--nb-hair)] sm:grid-cols-2 lg:grid-cols-4" aria-label={`Why ${brand.name}`}>
            {content.trustPoints.map((p, i) => (
              <li key={p} className="nb-col px-6 py-6 text-center">
                <span className="nb-display nb-italic nb-gold block text-2xl">{ROMAN[i] ?? i + 1}</span>
                <span className="mt-2 block text-[15px] font-medium leading-snug text-[var(--nb-ivory)]/90">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="nb-silks -mx-4 mt-5 md:-mx-8 md:mt-8" aria-hidden="true" />
      </section>

      {/* STORY — ivory interlude: a centred italic lead, then the long copy */}
      <section className="nb-light px-5 py-20 md:px-8 md:py-28">
        <Reveal className="mx-auto w-full max-w-3xl text-center">
          <p className="nb-caps text-[var(--nb-gold-deep)]">Our story</p>
          <h2 className="nb-display mt-4 break-words text-[clamp(2rem,4.4vw,3.6rem)] text-[var(--nb-green)]">{content.storyHeading}</h2>
          <Ornament />
          <p className="nb-lead text-[clamp(1.25rem,2.3vw,1.65rem)] text-[var(--nb-green-3)]">{lead}</p>
        </Reveal>
        <Reveal delay={0.1} className="mx-auto mt-10 w-full max-w-2xl space-y-6 text-[1.08rem] font-light leading-[1.85] text-[#27422f]">
          {rest.map((p, i) => <p key={i}>{p}</p>)}
        </Reveal>
        {content.storyVisual && (
          <div className="mx-auto mt-12 w-full max-w-4xl">
            <content.storyVisual />
          </div>
        )}
      </section>

      {/* SERVICES — three ruled columns with roman numerals */}
      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <div className="text-center">
            <p className="nb-caps nb-gold">The service</p>
            <h2 className="nb-display mx-auto mt-4 max-w-3xl break-words text-[clamp(2rem,4.2vw,3.4rem)]">{content.servicesHeading}</h2>
          </div>
          <div className="nb-rule mt-14 grid md:grid-cols-3">
            {content.services.map((s, i) => (
              <Link key={s.title} href={brandHref(basePath, s.href)} className="nb-col group flex flex-col px-8 py-12 text-center">
                <span className="nb-display nb-italic nb-gold text-5xl">{ROMAN[i]}</span>
                <h3 className="nb-display mt-6 text-[1.7rem]">{s.title}</h3>
                <p className="mt-3 flex-1 text-[15px] font-light leading-relaxed text-[var(--nb-ivory)]/75">{s.body}</p>
                <span className="nb-caps nb-gold mt-8 inline-flex items-center justify-center gap-2">
                  Enquire <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — ivory, centred heading, hairline rows */}
      <section className="nb-light px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto w-full max-w-3xl">
          <div className="text-center">
            <p className="nb-caps text-[var(--nb-gold-deep)]">Frequently asked</p>
            <h2 className="nb-display mt-4 break-words text-[clamp(1.9rem,3.8vw,3rem)] text-[var(--nb-green)]">{content.faqHeading}</h2>
          </div>
          <div className="nb-faq mt-12">
            {content.faqs.map((f) => (
              <details key={f.q} className="border-b border-[var(--nb-green)]/20 first:border-t">
                <summary className="flex items-center justify-between gap-6 py-5">
                  <span className="nb-display text-[1.2rem] font-medium leading-snug text-[var(--nb-green)] md:text-[1.35rem]">{f.q}</span>
                  <span className="nb-plus flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--nb-green)] text-[var(--nb-green)]">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 pr-12 font-light leading-relaxed text-[#27422f]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA — silks band, centred call to action */}
      <section className="bg-[var(--nb-green-2)]">
        <div className="nb-silks" aria-hidden="true" />
        <div className="mx-auto w-full max-w-4xl px-5 py-20 text-center md:px-8 md:py-28">
          <h2 className="nb-display break-words text-[clamp(2.1rem,5vw,4rem)]">{content.ctaHeading}</h2>
          <Ornament />
          <p className="mx-auto max-w-xl text-lg font-light text-[var(--nb-ivory)]/85">{content.ctaSub}</p>
          <ContactCtaRow
            quoteHref={content.quoteHref}
            whatsappMessage={content.whatsappMessage}
            whatsappNumber={brand.whatsappNumber}
            phone={brand.phone}
            phoneHref={brand.phoneHref}
            accent={brand.colors.accentLight}
            source={`${brand.slug}_bottom_cta`}
          />
          <ul className="mt-10 flex flex-col items-center justify-center gap-x-8 gap-y-2 text-sm text-[var(--nb-ivory)]/75 sm:flex-row">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {brand.address.line1}, {brand.address.town}, {brand.address.postcode}</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Fully insured on every job</li>
          </ul>
        </div>
      </section>
    </>
  );
}
