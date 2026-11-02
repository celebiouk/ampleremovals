import Link from "next/link";
import { Phone, ArrowRight, ShieldCheck, Clock, MapPin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { ContactCtaRow } from "@/components/local/multibrand/ContactCtaRow";
import { BrandChrome } from "@/components/local/multibrand/BrandChrome";
import { resolveBrandBasePath, brandHref } from "@/components/local/multibrand/brand-links";
import { breadcrumbSchema } from "@/lib/breadcrumb-schema";
import type { BrandNavLink } from "@/components/local/multibrand/BrandNavbar";
import type { Brand } from "@/lib/brands";
import type { ComponentType } from "react";

export interface BrandFaq { q: string; a: string }

export interface BrandPageContent {
  /** "classic" = centered hero, trust bar beneath. "split" = two-column hero
   *  with a stats panel. "bold" = full-bleed, high-contrast, asymmetric. */
  layout: "classic" | "split" | "bold";
  eyebrow: string;
  h1: string;
  subhead: string;
  /** 3-4 short trust points, brand's own facts. */
  trustPoints: string[];
  storyHeading: string;
  storyParagraphs: string[];
  /** Optional illustration/graphic rendered under the story copy — used by
   *  brands that want extra visual proof (e.g. ManyVans' fleet graphic).
   *  Omit for brands with no such asset; layout is unaffected either way. */
  storyVisual?: ComponentType;
  servicesHeading: string;
  services: { title: string; body: string; href: string }[];
  faqHeading: string;
  faqs: BrandFaq[];
  ctaHeading: string;
  ctaSub: string;
  /** Where "Get a free Quote" goes — /booking, /booking/man-and-van, or
   *  #get-price for a page with an inline widget. */
  quoteHref: string;
  whatsappMessage: string;
  /** Rendered directly under the hero copy — the instant-quote widget for
   *  House Clearance pages, or a CTA button pair for Removals/Man and Van. */
  heroAction: ComponentType;
}

export async function BrandPageShell({
  brand,
  logo: Logo,
  content,
  navLinks,
  path = "/",
}: {
  brand: Brand;
  logo: ComponentType<{ className?: string; variant?: "color" | "white" }>;
  content: BrandPageContent;
  /** Defaults to the standard Removals/Man and Van/House Clearance/Tips &
   *  Advice/About Us/Contact Us set — override only if a brand's page set
   *  genuinely differs. */
  navLinks?: BrandNavLink[];
  /** This page's path relative to the brand's own domain ("/", "/man-and-van",
   *  "/house-clearance") — used only to build an accurate BreadcrumbList;
   *  defaults to "/" (the brand's homepage, which renders no breadcrumb). */
  path?: string;
}) {
  const basePath = await resolveBrandBasePath(brand);
  const HeroAction = content.heroAction;
  const { primary, primaryDark, accent } = brand.colors;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MovingCompany",
        name: brand.name,
        description: content.subhead,
        address: {
          "@type": "PostalAddress",
          streetAddress: brand.address.line1,
          addressLocality: brand.address.town,
          postalCode: brand.address.postcode,
          addressCountry: "GB",
        },
        areaServed: brand.towns.map((t) => ({ "@type": "City", name: t })),
        telephone: brand.phoneHref.replace("tel:", "+44").replace(/^(\+44)0/, "$1"),
        email: brand.emailAddress,
        priceRange: "££",
        url: `https://${brand.domain}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      ...(path === "/"
        ? []
        : [
            breadcrumbSchema([
              { name: "Home", url: `https://${brand.domain}` },
              { name: path === "/man-and-van" ? "Man and Van" : path === "/house-clearance" ? "House Clearance" : content.eyebrow, url: `https://${brand.domain}${path}` },
            ]),
          ]),
    ],
  };

  return (
    <BrandChrome brand={brand} logo={Logo} navLinks={navLinks} quoteHref={content.quoteHref} whatsappMessage={content.whatsappMessage}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero — 3 structurally different layouts */}
      {content.layout === "classic" && (
        <section className="px-6 pb-16 pt-14 text-center text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${primaryDark})` }}>
          <div className="container mx-auto max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-80">{content.eyebrow}</p>
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">{content.h1}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg opacity-90">{content.subhead}</p>
            <div className="mt-8"><HeroAction /></div>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {content.trustPoints.map((p) => (
                <div key={p} className="rounded-xl bg-white/10 p-3 text-xs font-semibold backdrop-blur-sm">{p}</div>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.layout === "split" && (
        <section className="px-6 pb-16 pt-14 text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${primaryDark})` }}>
          <div className="container mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-80">{content.eyebrow}</p>
              <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">{content.h1}</h1>
              <p className="mt-5 max-w-xl text-lg opacity-90">{content.subhead}</p>
              <div className="mt-8"><HeroAction /></div>
            </div>
            <div className="space-y-3 rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              {content.trustPoints.map((p) => (
                <div key={p} className="flex items-center gap-3 text-sm font-semibold">
                  <Award className="h-5 w-5 shrink-0" style={{ color: accent }} /> {p}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.layout === "bold" && (
        <section className="px-6 pb-20 pt-14 text-white" style={{ background: primaryDark }}>
          <div className="container mx-auto max-w-4xl">
            <p className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide" style={{ background: accent }}>{content.eyebrow}</p>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl">{content.h1}</h1>
            <p className="mt-6 max-w-2xl text-xl opacity-90">{content.subhead}</p>
            <div className="mt-8"><HeroAction /></div>
            <div className="mt-12 flex flex-wrap gap-4">
              {content.trustPoints.map((p) => (
                <span key={p} className="rounded-full border-2 px-4 py-1.5 text-sm font-bold" style={{ borderColor: accent }}>{p}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Story */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-slate-900">{content.storyHeading}</h2>
          <div className="mt-6 space-y-4 text-slate-700">
            {content.storyParagraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {content.storyVisual && (
            <div className="mt-10">
              <content.storyVisual />
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="bg-slate-50 px-6 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-slate-900">{content.servicesHeading}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {content.services.map((s) => (
              <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-display text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.body}</p>
                <Link href={brandHref(basePath, s.href)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: primary }}>
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-slate-900">{content.faqHeading}</h2>
          <div className="mt-6 space-y-3">
            {content.faqs.map((f) => (
              <details key={f.q} className="rounded-xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-semibold text-slate-900">{f.q}</summary>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-6 py-16 text-white" style={{ background: primaryDark }}>
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold">{content.ctaHeading}</h2>
          <p className="mt-2 opacity-90">{content.ctaSub}</p>
          <ContactCtaRow
            quoteHref={content.quoteHref}
            whatsappMessage={content.whatsappMessage}
            whatsappNumber={brand.whatsappNumber}
            phone={brand.phone}
            phoneHref={brand.phoneHref}
            accent={accent}
            source={`${brand.slug}_bottom_cta`}
          />
          <div className="mt-8 flex flex-col items-center gap-1 text-sm opacity-80">
            <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {brand.address.line1}, {brand.address.town}, {brand.address.postcode}</p>
            <p className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Serving {brand.towns.join(" & ")}</p>
            <p className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Fully insured on every job</p>
          </div>
        </div>
      </section>
    </BrandChrome>
  );
}
