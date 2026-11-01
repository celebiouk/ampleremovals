import { notFound } from "next/navigation";
import { BrandTipsArticlePage } from "@/components/local/multibrand/BrandTipsPages";
import { NewburyRemovalsLogo } from "@/components/shared/logos/NewburyRemovalsLogo";
import { newburyRemovalsTips } from "@/lib/brand-page-content/newbury-removals";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["newbury-removals"];

export function generateStaticParams() {
  return newburyRemovalsTips.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = newburyRemovalsTips.find((a) => a.slug === slug);
  if (!article) return {};
  return brandPageMetadata(brand, `${article.title} | Newbury Removals`, article.excerpt, `/tips/${slug}`);
}

export default async function NewburyRemovalsTipsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = newburyRemovalsTips.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <BrandTipsArticlePage
      brand={brand}
      logo={NewburyRemovalsLogo}
      article={article}
      quoteHref="/booking"
      whatsappMessage="Hi, I'd like a quote for a move in Newbury."
    />
  );
}
