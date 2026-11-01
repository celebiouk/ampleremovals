import { notFound } from "next/navigation";
import { BrandTipsArticlePage } from "@/components/local/multibrand/BrandTipsPages";
import { ThatchamMoversLogo } from "@/components/shared/logos/ThatchamMoversLogo";
import { thatchamMoversTips } from "@/lib/brand-page-content/thatcham-movers";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["thatcham-movers"];

export function generateStaticParams() {
  return thatchamMoversTips.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = thatchamMoversTips.find((a) => a.slug === slug);
  if (!article) return {};
  return brandPageMetadata(brand, `${article.title} | Thatcham Movers`, article.excerpt, `/tips/${slug}`);
}

export default async function ThatchamMoversTipsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = thatchamMoversTips.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <BrandTipsArticlePage
      brand={brand}
      logo={ThatchamMoversLogo}
      article={article}
      quoteHref="/booking"
      whatsappMessage="Hi, I'd like a quote for a move in Thatcham."
    />
  );
}
