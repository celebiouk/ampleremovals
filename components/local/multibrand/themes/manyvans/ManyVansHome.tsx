import Link from "next/link";
import { ArrowRight, Check, MapPin, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { ContactCtaRow } from "@/components/local/multibrand/ContactCtaRow";
import { ManyVansFleet } from "@/components/shared/illustrations/ManyVansFleet";
import { brandHref } from "@/components/local/multibrand/brand-links";
import type { CSSProperties } from "react";
import type { Brand } from "@/lib/brands";
import type { BrandPageContent } from "@/components/local/multibrand/BrandPageShell";
import "./manyvans.css";

// On the red hero/CTA the primary button flips to charcoal so it never
// disappears into the livery colour; outlines stay white.
const ON_RED: CSSProperties = { ["--cta-primary" as string]: "#14161b", ["--cta-outline" as string]: "rgba(255,255,255,0.8)" };

export function ManyVansHome({ brand, basePath, content }: { brand: Brand; basePath: string; content: BrandPageContent }) {
  const HeroAction = content.heroAction;
  const ticker = content.trustPoints;

  return (
    <>
      {/* HERO — red livery panel, job ticket, and a fleet driving along the road */}
      <section className="mv-grain relative overflow-hidden bg-[var(--mv-red)] text-white" style={ON_RED}>
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-5 pb-6 pt-12 md:px-8 md:pt-16 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="mv-tab inline-block bg-[var(--mv-ink)] px-3 py-2 text-[11px] text-white">{content.eyebrow}</p>
            <h1 className="mv-display mt-6 break-words text-[clamp(2.1rem,4.7vw,4.4rem)]">{content.h1}</h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">{content.subhead}</p>
            <div className="mt-9">
              <HeroAction />
            </div>
          </div>

          {/* The "job ticket": every trust point, as a checked line on a perforated stub */}
          <aside className="lg:col-span-4 lg:pt-4" aria-label={`Why ${brand.name}`}>
            <div className="mv-ticket mx-auto max-w-sm rotate-[1.5deg] px-7 py-7 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] lg:ml-auto">
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--mv-ink)]/40 pb-3">
                <span className="mv-tab text-[11px]">Job ticket</span>
                <span className="mv-tab text-[11px] text-[var(--mv-red)]">{brand.towns.join(" · ")}</span>
              </div>
              <ul className="mt-4 space-y-3.5">
                {content.trustPoints.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[15px] font-semibold leading-snug">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-[var(--mv-red)] text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mv-barcode mt-6 opacity-80" aria-hidden="true" />
            </div>
          </aside>
        </div>

        {/* Road + driving fleet. Decorative; parked in view when motion is reduced. */}
        <div className="relative z-10 mt-2 h-[112px]" aria-hidden="true">
          <div className="mv-drive absolute bottom-[-22px] left-0 w-[380px] md:w-[460px]">
            <ManyVansFleet tone="light" className="h-auto w-full" />
          </div>
        </div>
        <div className="mv-road" aria-hidden="true" />
      </section>

      {/* TICKER — decorative repeat of the promises */}
      <div className="overflow-hidden bg-[var(--mv-ink)] py-3.5 text-white" aria-hidden="true">
        <div className="mv-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} data-dup={dup} className="flex shrink-0 items-center">
              {ticker.concat(ticker).map((t, i) => (
                <span key={`${t}-${i}`} className="mv-tab flex items-center whitespace-nowrap text-[12px]">
                  <span className="px-6">{t}</span>
                  <span className="text-[var(--mv-red)]">✱</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* STORY — sticky headline left, long copy right, fleet underneath */}
      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="mv-tab text-[11px] text-[var(--mv-red)]">Why {brand.name}</p>
              <h2 className="mv-display mt-4 break-words text-[clamp(2rem,4vw,3.4rem)]">{content.storyHeading}</h2>
            </div>
          </div>
          <Reveal className="space-y-6 lg:col-span-7">
            {content.storyParagraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "text-xl font-medium leading-relaxed" : "text-[1.06rem] leading-[1.8] text-[var(--mv-ink-soft)]"}>
                {p}
              </p>
            ))}
          </Reveal>
        </div>
        {content.storyVisual && (
          <div className="mx-auto mt-16 w-full max-w-7xl border-t-[3px] border-[var(--mv-ink)] pt-10">
            <content.storyVisual />
          </div>
        )}
      </section>

      {/* SERVICES — dark band, numbered van-panel tiles with a clipped corner */}
      <section className="relative overflow-hidden bg-[var(--mv-ink)] px-5 py-20 text-white md:px-8 md:py-28">
        <div className="mx-auto w-full max-w-7xl">
          <h2 className="mv-display max-w-3xl break-words text-[clamp(2rem,4.4vw,3.8rem)]">{content.servicesHeading}</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {content.services.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <Link href={brandHref(basePath, s.href)} className="mv-panel group flex min-h-[340px] flex-col bg-[#1e2128] p-7">
                  <span className="mv-display mv-outline mv-num text-[5.5rem] leading-none">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mv-display mt-auto pt-10 text-[1.6rem]">{s.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/70 group-hover:text-white">{s.body}</p>
                  <span className="mv-tab mt-6 inline-flex items-center gap-2 text-[11px]">
                    Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — ruled rows, sticky heading with a direct line */}
      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <h2 className="mv-display break-words text-[clamp(2rem,3.6vw,3rem)]">{content.faqHeading}</h2>
              <a
                href={brand.phoneHref}
                className="mt-8 block border-[3px] border-[var(--mv-ink)] bg-[var(--mv-paper)] p-5 shadow-[6px_6px_0_0_var(--mv-ink)] transition-transform hover:-translate-y-0.5"
              >
                <span className="mv-tab text-[10px] text-[var(--mv-red)]">Rather talk it through?</span>
                <span className="mv-display mv-num mt-2 block text-[1.7rem]">{brand.phone}</span>
              </a>
            </div>
          </div>
          <div className="mv-faq lg:col-span-8">
            {content.faqs.map((f) => (
              <details key={f.q} className="border-t-2 border-[var(--mv-ink)] last:border-b-2">
                <summary className="flex items-start justify-between gap-6 py-5">
                  <span className="text-lg font-bold leading-snug md:text-xl">{f.q}</span>
                  <span className="mv-plus mv-display mt-0.5 text-3xl leading-none text-[var(--mv-red)]">+</span>
                </summary>
                <p className="max-w-2xl pb-6 pr-10 leading-relaxed text-[var(--mv-ink-soft)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA — back to red, dashed road line on top */}
      <section className="mv-grain relative overflow-hidden bg-[var(--mv-red)] px-5 pb-20 pt-24 text-white md:px-8" style={ON_RED}>
        <div className="absolute inset-x-0 top-0 h-[10px] bg-[repeating-linear-gradient(90deg,#14161b_0_36px,transparent_36px_72px)]" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-5xl text-center">
          <h2 className="mv-display break-words text-[clamp(2.2rem,6vw,5rem)]">{content.ctaHeading}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/90">{content.ctaSub}</p>
          <ContactCtaRow
            quoteHref={content.quoteHref}
            whatsappMessage={content.whatsappMessage}
            whatsappNumber={brand.whatsappNumber}
            phone={brand.phone}
            phoneHref={brand.phoneHref}
            accent={brand.colors.accent}
            source={`${brand.slug}_bottom_cta`}
          />
          <ul className="mt-10 flex flex-col items-center justify-center gap-x-8 gap-y-2 text-sm text-white/85 sm:flex-row">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {brand.address.line1}, {brand.address.town}, {brand.address.postcode}</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Fully insured on every job</li>
          </ul>
        </div>
      </section>
    </>
  );
}
