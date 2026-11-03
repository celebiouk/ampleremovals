import Link from "next/link";
import { ArrowRight, Check, Home, MapPin, PackageOpen, Phone, Plus, ShieldCheck, Sparkles, Truck, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { ContactCtaRow } from "@/components/local/multibrand/ContactCtaRow";
import { brandHref } from "@/components/local/multibrand/brand-links";
import { NewburyHeroArt } from "./NewburyHeroArt";
import type { CSSProperties, ReactNode } from "react";
import type { Brand } from "@/lib/brands";
import type { BrandPageContent } from "@/components/local/multibrand/BrandPageShell";
import "./newbury.css";

// On the green closing banner the primary button flips to gold (dark text keeps contrast).
const ON_GREEN: CSSProperties = {
  ["--cta-primary" as string]: "#fbbf24",
  ["--cta-primary-fg" as string]: "#0c3a1f",
  ["--cta-outline" as string]: "rgba(255,255,255,0.8)",
  ["--cta-fg" as string]: "#fff",
};

/** Mark the town name in the headline with a gold highlighter swipe. */
function markTown(text: string, town: string): ReactNode {
  const i = text.indexOf(town);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="nb-mark">{town}</span>
      {text.slice(i + town.length)}
    </>
  );
}

/** Pick a friendly icon from the service title (the same component renders
 *  all three service pages, whose "other services" lists differ). */
function iconFor(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (t.includes("clearance")) return PackageOpen;
  if (t.includes("man and van")) return Truck;
  if (t.includes("call")) return Phone;
  if (t.includes("removal")) return Home;
  return Sparkles;
}

export function NewburyHome({ brand, basePath, content }: { brand: Brand; basePath: string; content: BrandPageContent }) {
  const HeroAction = content.heroAction;
  const [lead, ...rest] = content.storyParagraphs;

  return (
    <>
      {/* HERO — light and bright: headline left, a shop-window arch with a van right */}
      <section className="nb-sage relative">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-28 pt-16 md:px-8 md:pt-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--nb-sage-200)] bg-white px-4 py-1.5 text-sm font-bold text-[var(--nb-green)]">
              <span className="h-2 w-2 rounded-full bg-[var(--nb-gold-lite)]" aria-hidden="true" />
              {content.eyebrow}
            </p>
            <h1 className="nb-display mt-6 break-words text-[clamp(2.4rem,5.4vw,4.8rem)] text-[var(--nb-green-deep)]">
              {markTown(content.h1, brand.address.town)}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--nb-ink-soft)] md:text-xl">{content.subhead}</p>
            <div className="mt-8">
              <HeroAction />
            </div>
          </div>

          <div className="hidden lg:col-span-5 lg:block">
            <NewburyHeroArt className="mx-auto h-auto w-full max-w-[400px] drop-shadow-[0_28px_30px_rgba(12,58,31,0.22)]" />
          </div>
        </div>
      </section>

      {/* TRUST STRIP — overlaps the hero edge like a counter in front of the stall */}
      <div className="relative z-10 -mt-14 px-5 md:px-8">
        <ul className="nb-card mx-auto grid w-full max-w-6xl gap-x-6 gap-y-4 p-6 sm:grid-cols-2 lg:grid-cols-4" aria-label={`Why ${brand.name}`}>
          {content.trustPoints.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[15px] font-semibold leading-snug text-[var(--nb-green-deep)]">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--nb-green)] text-white">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* STORY — heading and a "find us" card on the left, copy on the right */}
      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--nb-gold)]">Our story</p>
              <h2 className="nb-display mt-3 break-words text-[clamp(2rem,3.8vw,3.2rem)] text-[var(--nb-green-deep)]">{content.storyHeading}</h2>
              <div className="mt-8 rounded-[1.75rem] bg-[var(--nb-green)] p-6 text-white">
                <p className="flex items-start gap-2 font-semibold"><MapPin className="mt-1 h-4 w-4 shrink-0 text-[var(--nb-gold-lite)]" /> {brand.address.line1}, {brand.address.town}, {brand.address.postcode}</p>
                <a href={brand.phoneHref} className="nb-display mt-3 block text-3xl text-[var(--nb-gold-lite)] hover:underline">{brand.phone}</a>
              </div>
            </div>
          </div>
          <Reveal className="space-y-6 lg:col-span-7">
            <p className="nb-display text-[clamp(1.35rem,2.3vw,1.8rem)] font-bold leading-snug text-[var(--nb-green)]">{lead}</p>
            {rest.map((p, i) => (
              <p key={i} className="text-[1.08rem] leading-[1.8] text-[var(--nb-ink-soft)]">{p}</p>
            ))}
            {content.storyVisual && (
              <div className="pt-4">
                <content.storyVisual />
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* SERVICES — three friendly cards on sage */}
      <section className="nb-sage px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--nb-gold)]">What we do</p>
            <h2 className="nb-display mx-auto mt-3 max-w-3xl break-words text-[clamp(2rem,4vw,3.3rem)] text-[var(--nb-green-deep)]">{content.servicesHeading}</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {content.services.map((s, i) => {
              const Icon = iconFor(s.title);
              return (
                <Reveal key={s.title} delay={i * 0.08}>
                  <Link href={brandHref(basePath, s.href)} className="nb-card nb-lift group flex h-full flex-col p-7">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--nb-cream)] text-[var(--nb-green)]">
                      <Icon className="h-7 w-7" />
                    </span>
                    <h3 className="nb-display mt-6 text-2xl text-[var(--nb-green-deep)]">{s.title}</h3>
                    <p className="mt-3 flex-1 leading-relaxed text-[var(--nb-ink-soft)]">{s.body}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-[15px] font-bold text-[var(--nb-green)]">
                      Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ — rounded accordion cards */}
      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--nb-gold)]">Good questions</p>
              <h2 className="nb-display mt-3 break-words text-[clamp(1.9rem,3.4vw,2.8rem)] text-[var(--nb-green-deep)]">{content.faqHeading}</h2>
              <a href={brand.phoneHref} className="mt-8 flex items-center gap-4 rounded-[1.5rem] bg-[var(--nb-cream)] p-5 transition-transform hover:-translate-y-0.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--nb-green)] text-white"><Phone className="h-5 w-5" /></span>
                <span>
                  <span className="block text-sm font-semibold text-[var(--nb-ink-soft)]">Rather talk it through?</span>
                  <span className="nb-display block text-xl text-[var(--nb-green-deep)]">{brand.phone}</span>
                </span>
              </a>
            </div>
          </div>
          <div className="nb-faq space-y-3 lg:col-span-8">
            {content.faqs.map((f) => (
              <details key={f.q} className="rounded-2xl border border-[var(--nb-sage-200)] bg-white">
                <summary className="flex items-center justify-between gap-5 px-6 py-5">
                  <span className="text-[1.05rem] font-bold leading-snug text-[var(--nb-green-deep)] md:text-lg">{f.q}</span>
                  <span className="nb-plus flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--nb-sage-100)] text-[var(--nb-green)]">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="max-w-2xl px-6 pb-6 leading-relaxed text-[var(--nb-ink-soft)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA — a rounded green banner */}
      <section className="px-5 pb-24 md:px-8">
        <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2.25rem] bg-[var(--nb-green)] px-6 py-16 text-center text-white md:px-14 md:py-20" style={ON_GREEN}>
          <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--nb-gold-lite)] opacity-20" />
          <div aria-hidden="true" className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-white opacity-[0.07]" />
          <div className="relative">
            <h2 className="nb-display mx-auto max-w-3xl break-words text-[clamp(2.1rem,4.6vw,3.8rem)]">{content.ctaHeading}</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">{content.ctaSub}</p>
            <ContactCtaRow
              quoteHref={content.quoteHref}
              whatsappMessage={content.whatsappMessage}
              whatsappNumber={brand.whatsappNumber}
              phone={brand.phone}
              phoneHref={brand.phoneHref}
              accent={brand.colors.accentLight}
              source={`${brand.slug}_bottom_cta`}
            />
            <ul className="mt-9 flex flex-col items-center justify-center gap-x-8 gap-y-2 text-sm text-white/80 sm:flex-row">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {brand.address.line1}, {brand.address.town}, {brand.address.postcode}</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Fully insured on every job</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
