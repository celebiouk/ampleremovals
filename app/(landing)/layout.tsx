import { Pixels } from "@/components/analytics/Pixels";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";
import { getCurrentBrand } from "@/lib/brand-context";
import { brandThemeCssVars } from "@/lib/brand-theme";

/**
 * Distraction-free layout for paid-ad landing pages: NO navbar, NO footer, no
 * hamburger menu — nothing to click except the form. Keeps the Meta pixel and
 * attribution capture so ad conversions are tracked.
 *
 * Brand-aware for the same reason app/(shared-booking)/layout.tsx is: this
 * page was built before the white-label brands existed and, until this fix,
 * showed "Ample Removals" to every visitor regardless of which brand's
 * domain served the ad — the exact disguise-breaking leak the brands exist
 * to avoid. Wrapping in data-brand-theme retints every brand-purple and
 * brand-green utility class LandingBooking.tsx already uses, via the CSS
 * variable overrides in globals.css — no colour classes need to change.
 */
export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const brand = await getCurrentBrand();
  const isAmple = brand.slug === "ample";

  return (
    <div className="min-h-screen" data-brand-theme={isAmple ? undefined : true} style={isAmple ? undefined : brandThemeCssVars(brand)}>
      <Pixels />
      <AttributionCapture />
      {children}
    </div>
  );
}
