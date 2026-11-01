import { getCurrentBrand } from "@/lib/brand-context";
import { brandPageMetadata } from "@/lib/brands";

/**
 * The quote/deposit page below is a "use client" component (lots of
 * interactive payment UI), which means it can't export generateMetadata
 * itself — only a Server Component can. This layout exists purely to
 * give that page brand-correct <title>/OG tags instead of silently
 * inheriting the root layout's Ample defaults.
 */
export async function generateMetadata() {
  const brand = await getCurrentBrand();
  return brandPageMetadata(brand, "Your Quote", "Review your quote and secure your booking date.", "/quote");
}

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
