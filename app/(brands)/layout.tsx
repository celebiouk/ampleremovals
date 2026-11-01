import { Suspense } from "react";
import { Pixels } from "@/components/analytics/Pixels";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

/**
 * Layout for the white-label brand pages (Thatcham Movers, Newbury Removals,
 * ManyVans) — deliberately has NO Navbar/Footer. Those are Ample Removals'
 * own site chrome; a brand page supplies its own header/contact section via
 * BrandPageShell, so a visitor on manyvans.com never sees Ample branding.
 * Analytics tracking is kept, since it matters just as much on these pages.
 */
export default function BrandsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Pixels />
      <AttributionCapture />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <main className="flex-1">{children}</main>
    </div>
  );
}
