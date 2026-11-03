import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { Brand } from "@/lib/brands";
import type { BrandNavLink } from "@/components/local/multibrand/BrandNavbar";
import type { BrandPageContent } from "@/components/local/multibrand/BrandPageShell";

export type BrandLogo = ComponentType<{ className?: string; variant?: "color" | "white" }>;

/**
 * One visual identity for a white-label brand. The three removals brands share
 * a booking engine and a content model, but each is meant to read as a
 * different company, so layout lives here rather than in a shared template.
 * Content (copy, FAQs, JSON-LD, CTA hrefs, tracking) stays in the shared shell.
 */
export interface BrandTheme {
  /** CSS custom properties for this brand's design tokens, set on the page root. */
  vars: CSSProperties;
  /** Root class (also the CSS scope for the brand's stylesheet). */
  rootClass: string;
  /** Sticky header. Client component, so the logo arrives as an element. */
  Header: ComponentType<{ brand: Brand; logo: ReactNode; homeHref: string; links: BrandNavLink[]; quoteHref: string }>;
  Footer: ComponentType<{ brand: Brand; logo: ReactNode; logoOnDark: ReactNode; links: BrandNavLink[] }>;
  /** The full body of a service page (hero to closing CTA). */
  Home: ComponentType<{ brand: Brand; basePath: string; content: BrandPageContent }>;
  /** Colours for the always-visible bottom Call/WhatsApp bar and the footer fill behind it. */
  sticky: { callColor: string; barBackground: string; barBorder: string; footerFill: string };
  /** Hero for the inner pages (About, Contact, Tips). */
  PageHero: ComponentType<{ eyebrow: string; title: string; intro?: string }>;
  /** Class tokens for the inner pages so they inherit the brand's character. */
  ui: {
    section: string;
    sectionAlt: string;
    h2: string;
    prose: string;
    card: string;
    cardTitle: string;
    cardBody: string;
    link: string;
    icon: string;
    meta: string;
    ctaPanel: string;
  };
}
