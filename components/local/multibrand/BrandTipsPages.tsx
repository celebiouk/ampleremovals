import Link from "next/link";
import { ArrowRight, Clock, CalendarDays } from "lucide-react";
import { BrandChrome } from "@/components/local/multibrand/BrandChrome";
import { resolveBrandBasePath, brandHref } from "@/components/local/multibrand/brand-links";
import { getBrandTheme } from "@/components/local/multibrand/themes/registry";
import type { Brand } from "@/lib/brands";
import type { ComponentType } from "react";

export interface TipArticle {
  slug: string;
  title: string;
  excerpt: string;
  readingTime: string;
  publishedAt: string; // "DD Month YYYY", display only
  sections: { heading?: string; paragraphs: string[] }[];
}

/**
 * The actual /tips index content, with no site chrome of its own —
 * split out from BrandTipsIndexPage so Ample's version (which keeps
 * Ample's own Navbar/Footer via the (public) layout) can render this
 * directly instead of picking up a second, brand-chrome navbar/footer
 * on top of Ample's existing one.
 */
export async function TipsIndexContent({ brand, articles }: { brand: Brand; articles: TipArticle[] }) {
  const basePath = await resolveBrandBasePath(brand);
  const theme = getBrandTheme(brand.slug);
  if (theme) {
    const { ui } = theme;
    return (
      <>
        <theme.PageHero
          eyebrow="Tips & Advice"
          title={`Moving advice from ${brand.name}`}
          intro="Real, practical answers to the questions we get asked most, written by the people who actually do the moving."
        />
        <section className={ui.section}>
          <div className="grid gap-6 sm:grid-cols-2">
            {articles.map((a) => (
              <Link key={a.slug} href={brandHref(basePath, `/tips/${a.slug}`)} className={`group flex flex-col transition-transform hover:-translate-y-1 ${ui.card}`}>
                <h2 className={ui.cardTitle}>{a.title}</h2>
                <p className={`flex-1 ${ui.cardBody}`}>{a.excerpt}</p>
                <div className={`mt-4 flex items-center gap-4 ${ui.meta}`}>
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {a.publishedAt}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.readingTime}</span>
                </div>
                <span className={`mt-4 inline-flex items-center gap-1 ${ui.link}`}>
                  Read the guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="px-6 pb-16 pt-14 text-white" style={{ background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.primaryDark})` }}>
        <div className="container mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-80">Tips & Advice</p>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Moving Advice from {brand.name}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg opacity-90">
            Real, practical answers to the questions we get asked most — written by the people who actually do the moving.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="container mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={brandHref(basePath, `/tips/${a.slug}`)}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
            >
              <h2 className="font-display text-xl font-bold text-slate-900">{a.title}</h2>
              <p className="mt-2 flex-1 text-sm text-slate-600">{a.excerpt}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {a.publishedAt}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.readingTime}</span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: brand.colors.primary }}>
                Read the guide <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

/** Same split as TipsIndexContent, for the single-article page. */
export async function TipsArticleContent({ brand, article, quoteHref }: { brand: Brand; article: TipArticle; quoteHref: string }) {
  const basePath = await resolveBrandBasePath(brand);
  const theme = getBrandTheme(brand.slug);
  if (theme) {
    const { ui } = theme;
    return (
      <article className="mx-auto w-full max-w-3xl px-5 py-14 md:px-8 md:py-20">
        <Link href={brandHref(basePath, "/tips")} className={ui.link}>← Back to Tips & Advice</Link>
        <h1 className={`${ui.h2} mt-5 !text-[clamp(2rem,4.4vw,3.2rem)]`}>{article.title}</h1>
        <div className={`mt-4 flex items-center gap-4 ${ui.meta}`}>
          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {article.publishedAt}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {article.readingTime}</span>
        </div>
        <div className="mt-10 space-y-9">
          {article.sections.map((section, i) => (
            <div key={i}>
              {section.heading && <h2 className={`${ui.cardTitle} !text-2xl`}>{section.heading}</h2>}
              <div className={`${ui.prose} mt-3`}>
                {section.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
              </div>
            </div>
          ))}
        </div>
        <div className={`mt-14 ${ui.ctaPanel}`}>
          <p className={ui.cardTitle}>Ready to get a price?</p>
          <Link
            href={quoteHref}
            className={`mt-5 inline-flex items-center gap-2 px-6 py-3 font-bold ${ui.ctaButton}`}
          >
            Get a free Quote <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="px-6 py-16">
      <div className="container mx-auto max-w-2xl">
        <Link href={brandHref(basePath, "/tips")} className="text-sm font-semibold" style={{ color: brand.colors.primary }}>← Back to Tips & Advice</Link>
        <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">{article.title}</h1>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {article.publishedAt}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {article.readingTime}</span>
        </div>
        <div className="mt-8 space-y-6">
          {article.sections.map((section, i) => (
            <div key={i}>
              {section.heading && <h2 className="font-display text-xl font-bold text-slate-900">{section.heading}</h2>}
              <div className="mt-3 space-y-4 text-slate-700">
                {section.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl p-6 text-center text-white" style={{ background: brand.colors.primaryDark }}>
          <p className="font-display text-lg font-bold">Ready to get a price?</p>
          <Link
            href={quoteHref}
            style={{ background: brand.colors.accent }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-6 py-3 font-bold text-white"
          >
            Get a free Quote <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/** /tips — the index of every article for this brand. Future daily posts
 *  get added to the brand's articles array (see lib/brand-page-content/
 *  *-tips.tsx) and show up here automatically — no page changes needed.
 *  Used by the 3 white-label brands (own chrome via BrandChrome); Ample's
 *  own /tips page renders TipsIndexContent directly instead, inside its
 *  normal (public) layout — see app/(public)/tips/page.tsx. */
export async function BrandTipsIndexPage({
  brand,
  logo: Logo,
  articles,
  quoteHref,
  whatsappMessage,
}: {
  brand: Brand;
  logo: ComponentType<{ className?: string; variant?: "color" | "white" }>;
  articles: TipArticle[];
  quoteHref: string;
  whatsappMessage: string;
}) {
  return (
    <BrandChrome brand={brand} logo={Logo} quoteHref={quoteHref} whatsappMessage={whatsappMessage}>
      <TipsIndexContent brand={brand} articles={articles} />
    </BrandChrome>
  );
}

/** /tips/[slug] — a single article. See BrandTipsIndexPage's note on Ample. */
export async function BrandTipsArticlePage({
  brand,
  logo: Logo,
  article,
  quoteHref,
  whatsappMessage,
}: {
  brand: Brand;
  logo: ComponentType<{ className?: string; variant?: "color" | "white" }>;
  article: TipArticle;
  quoteHref: string;
  whatsappMessage: string;
}) {
  return (
    <BrandChrome brand={brand} logo={Logo} quoteHref={quoteHref} whatsappMessage={whatsappMessage}>
      <TipsArticleContent brand={brand} article={article} quoteHref={quoteHref} />
    </BrandChrome>
  );
}
