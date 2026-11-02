import type { Metadata } from "next";
import { TipsIndexContent } from "@/components/local/multibrand/BrandTipsPages";
import { ampleTips } from "@/lib/brand-page-content/ample-tips";
import { AMPLE_BRAND } from "@/lib/brands";

export const metadata: Metadata = {
  title: "Tips & Advice",
  description: "Practical moving advice, price guides and checklists from Ample Removals — written by the crew that does the moving.",
  alternates: { canonical: "https://www.ampleremovals.com/tips" },
};

export default function AmpleTipsIndexPage() {
  return (
    <div className="pb-20">
      <TipsIndexContent brand={AMPLE_BRAND} articles={ampleTips} />
    </div>
  );
}
