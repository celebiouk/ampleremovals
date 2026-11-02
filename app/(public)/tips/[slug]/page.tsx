import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TipsArticleContent } from "@/components/local/multibrand/BrandTipsPages";
import { ampleTips } from "@/lib/brand-page-content/ample-tips";
import { AMPLE_BRAND } from "@/lib/brands";

export function generateStaticParams() {
  return ampleTips.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = ampleTips.find((a) => a.slug === slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `https://www.ampleremovals.com/tips/${slug}` },
  };
}

export default async function AmpleTipsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = ampleTips.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <div className="pb-20">
      <TipsArticleContent brand={AMPLE_BRAND} article={article} quoteHref="/booking" />
    </div>
  );
}
