import Link from "next/link";
import { MapPin } from "lucide-react";
import { StickyQuoteBar } from "@/components/local/StickyQuoteBar";
import { BrandNavbar, type BrandNavLink } from "@/components/local/multibrand/BrandNavbar";
import { standardBrandNavLinks } from "@/components/local/multibrand/brand-nav-links";
import { resolveBrandBasePath, brandHref } from "@/components/local/multibrand/brand-links";
import { getBrandTheme } from "@/components/local/multibrand/themes/registry";
import type { Brand } from "@/lib/brands";
import type { ComponentType, ReactNode } from "react";

/**
 * The navbar + sticky WhatsApp/Call bar + footer every brand page shares —
 * used by BrandPageShell (the 3 service pages) and directly by the simpler
 * About/Contact/Tips pages. Deliberately has no link anywhere back to Ample
 * Removals: these brands are meant to look fully independent.
 */
export async function BrandChrome({
  brand,
  logo: Logo,
  navLinks,
  quoteHref,
  whatsappMessage,
  children,
}: {
  brand: Brand;
  logo: ComponentType<{ className?: string; variant?: "color" | "white" }>;
  navLinks?: BrandNavLink[];
  quoteHref: string;
  whatsappMessage: string;
  children: ReactNode;
}) {
  const basePath = await resolveBrandBasePath(brand);
  const links = (navLinks ?? standardBrandNavLinks()).map((l) => ({ ...l, href: brandHref(basePath, l.href) }));
  const homeHref = basePath || "/";
  const theme = getBrandTheme(brand.slug);

  // Themed brands own their whole frame (header, footer, tokens). Everything
  // else below is the original shared chrome.
  if (theme) {
    return (
      <div className={theme.rootClass} style={theme.vars}>
        <StickyQuoteBar
          quoteHref={quoteHref}
          whatsappMessage={whatsappMessage}
          whatsappNumber={brand.whatsappNumber}
          phoneHref={brand.phoneHref}
          accentColor={brand.colors.accent}
          callColor={theme.sticky.callColor}
          barBackground={theme.sticky.barBackground}
          barBorder={theme.sticky.barBorder}
          hideQuotePill
        />
        <theme.Header brand={brand} logo={<Logo />} homeHref={homeHref} links={links} quoteHref={quoteHref} />
        {children}
        {/* pb clears the fixed bottom bar; it takes the footer's colour so no strip shows */}
        <div className="pb-20" style={{ background: theme.sticky.footerFill }}>
          <theme.Footer brand={brand} logo={<Logo />} logoOnDark={<Logo variant="white" />} links={links} />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <StickyQuoteBar
        quoteHref={quoteHref}
        whatsappMessage={whatsappMessage}
        whatsappNumber={brand.whatsappNumber}
        phoneHref={brand.phoneHref}
        accentColor={brand.colors.accent}
        hideQuotePill
      />
      <BrandNavbar brand={brand} logo={<Logo />} homeHref={homeHref} links={links} quoteHref={quoteHref} />

      {children}

      <footer className="border-t border-slate-100 bg-white px-6 py-8 text-sm text-slate-500">
        <div className="container mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <Logo />
            <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {brand.address.line1}, {brand.address.town}, {brand.address.postcode}</p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-4">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-slate-900">{link.label}</Link>
            ))}
          </nav>
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
