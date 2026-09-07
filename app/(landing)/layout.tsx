import { Pixels } from "@/components/analytics/Pixels";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";

/**
 * Distraction-free layout for paid-ad landing pages: NO navbar, NO footer, no
 * hamburger menu — nothing to click except the form. Keeps the Meta pixel and
 * attribution capture so ad conversions are tracked.
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Pixels />
      <AttributionCapture />
      {children}
    </div>
  );
}
