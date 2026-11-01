import { Suspense } from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Pixels } from "@/components/analytics/Pixels";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { getCurrentBrand } from "@/lib/brand-context";
import { brandThemeCssVars } from "@/lib/brand-theme";
import { BRAND_LOGO_BY_SLUG } from "@/components/shared/logos/brand-logo-registry";

/**
 * Layout for the booking journey shared by every brand — the quote
 * wizard (/booking/[service]), the deposit/payment page
 * (/quote/[bookingId]/[token]), and /confirmation. This is deliberately
 * its own route group, separate from (public): (public) wraps 900+
 * Ample-only marketing pages, and this layout needs to read the request's
 * Host header (via getCurrentBrand()) to know which brand is booking —
 * doing that in (public) would force every one of those 900+ pages out
 * of static generation too (see tasks/brand-playbook.md, lesson 2).
 * Scoping it to just this journey costs nothing: a booking flow is
 * inherently per-visitor and dynamic already.
 *
 * Ample's own flow is untouched — same Navbar/Footer as before. A
 * white-label brand gets its own lightweight header (logo + phone, no
 * distracting nav mid-booking) and the booking wizard's colours are
 * re-themed to match via the CSS variables in globals.css.
 */
export default async function SharedBookingLayout({ children }: { children: React.ReactNode }) {
  const brand = await getCurrentBrand();
  const isAmple = brand.slug === "ample";

  if (isAmple) {
    return (
      <div className="flex min-h-screen flex-col">
        <Pixels />
        <AttributionCapture />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  const Logo = BRAND_LOGO_BY_SLUG[brand.slug];

  return (
    <div data-brand-theme style={brandThemeCssVars(brand)} className="flex min-h-screen flex-col">
      <Pixels />
      <AttributionCapture />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <header className="border-b border-slate-100 bg-white px-6 py-4">
        <div className="container mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/">{Logo && <Logo />}</Link>
          <a href={brand.phoneHref} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Phone className="h-4 w-4" /> {brand.phone}
          </a>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-100 bg-white px-6 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {brand.name}. All rights reserved.
      </footer>
    </div>
  );
}
