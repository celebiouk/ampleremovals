import { notFound } from "next/navigation";
import { BrandTipsArticlePage } from "@/components/local/multibrand/BrandTipsPages";
import { ManyVansLogo } from "@/components/shared/logos/ManyVansLogo";
import { manyVansTips } from "@/lib/brand-page-content/manyvans";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["manyvans"];

export function generateStaticParams() {
  return manyVansTips.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = manyVansTips.find((a) => a.slug === slug);
  if (!article) return {};
  return brandPageMetadata(brand, `${article.title} | ManyVans`, article.excerpt, `/tips/${slug}`);
}

export default async function ManyVansTipsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = manyVansTips.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <BrandTipsArticlePage
      brand={brand}
      logo={ManyVansLogo}
      article={article}
      quoteHref="/booking"
      whatsappMessage="Hi, I'd like a quote for a move (Newbury/Thatcham)."
    />
  );
}
