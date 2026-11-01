/**
 * Multi-brand configuration — the single source of truth for every
 * white-label storefront running on this codebase. Ample Removals is brand
 * "ample" (the default/fallback); everything else is a genuinely separate
 * trading identity sharing the same booking engine, payments and admin.
 *
 * Adding a future brand (readingremovals.co.uk etc.) is: add a row here,
 * add the domain in Vercel, verify it as a Resend sending domain, build its
 * 3 pages. No other plumbing changes.
 */
export interface Brand {
  slug: string;
  domain: string;
  name: string;
  tagline: string;
  /** Display phone, e.g. "0333 577 2070". */
  phone: string;
  /** tel: href, digits only after the scheme. */
  phoneHref: string;
  /** wa.me target, digits only (E.164 without "+") — so a brand's "WhatsApp
   *  us" button and sticky bar never leak Ample's own WhatsApp number. */
  whatsappNumber: string;
  /** The address customers/schema.org see — real, confirmed NAP. */
  address: { line1: string; town: string; postcode: string };
  /** Town(s) this brand's pages cover. */
  towns: string[];
  /** The "from" identity on emails sent for this brand's bookings. */
  emailFrom: string;
  emailAddress: string;
  colors: {
    primary: string;
    primaryDark: string;
    accent: string;
    accentLight: string;
  };
  /** Ample only, for now — every other brand is card (+ Klarna) only. */
  allowBankTransfer: boolean;
  /** Ample only, for now — other brands never trigger an automated SMS. */
  allowAutomatedSms: boolean;
}

export const AMPLE_BRAND: Brand = {
  slug: "ample",
  domain: "www.ampleremovals.com",
  name: "Ample Removals",
  tagline: "Premium, professional removals",
  phone: "0333 577 2070",
  phoneHref: "tel:03335772070",
  whatsappNumber: "447344683477",
  address: { line1: "41 Rosedale Garden", town: "Thatcham", postcode: "RG19 3LE" },
  towns: ["Newbury", "Thatcham"],
  emailFrom: "Ample Removals",
  emailAddress: "bookings@ampleremovals.com",
  colors: { primary: "#6b21a8", primaryDark: "#581c87", accent: "#16a34a", accentLight: "#22c55e" },
  allowBankTransfer: true,
  allowAutomatedSms: true,
};

export const BRANDS: Brand[] = [
  AMPLE_BRAND,
  {
    slug: "thatcham-movers",
    domain: "www.thatchammovers.co.uk",
    name: "Thatcham Movers",
    tagline: "Thatcham's own removal company",
    phone: "07958 623678",
    phoneHref: "tel:07958623678",
    whatsappNumber: "447958623678",
    address: { line1: "17 Thatcham Broadway", town: "Thatcham", postcode: "RG19 3HX" },
    towns: ["Thatcham"],
    emailFrom: "Thatcham Movers",
    emailAddress: "bookings@thatchammovers.co.uk",
    // Deep navy + warm amber — authoritative, local, distinct from Ample's purple/green.
    colors: { primary: "#1e3a5f", primaryDark: "#13263f", accent: "#d97706", accentLight: "#f59e0b" },
    allowBankTransfer: false,
    allowAutomatedSms: false,
  },
  {
    slug: "newbury-removals",
    domain: "www.newburyremovals.co.uk",
    name: "Newbury Removals",
    tagline: "Newbury's local removal specialists",
    phone: "0333 577 2070",
    phoneHref: "tel:03335772070",
    // Temporary — same line as Ample until Newbury Removals gets its own.
    whatsappNumber: "443335772070",
    address: { line1: "4 Market Place", town: "Newbury", postcode: "RG14 5BD" },
    towns: ["Newbury"],
    emailFrom: "Newbury Removals",
    emailAddress: "bookings@newburyremovals.co.uk",
    // Racing green + gold — a nod to Newbury Racecourse, premium and local.
    colors: { primary: "#14532d", primaryDark: "#0d3a1f", accent: "#ca8a04", accentLight: "#eab308" },
    allowBankTransfer: false,
    allowAutomatedSms: false,
  },
  {
    slug: "manyvans",
    domain: "www.manyvans.com",
    name: "ManyVans",
    tagline: "A van ready when you are",
    phone: "0333 577 2070",
    phoneHref: "tel:03335772070",
    // Temporary — same line as Ample until ManyVans gets its own.
    whatsappNumber: "443335772070",
    address: { line1: "20 Market Street", town: "Newbury", postcode: "RG14 5DP" },
    towns: ["Newbury", "Thatcham"],
    emailFrom: "ManyVans",
    emailAddress: "bookings@manyvans.com",
    // Bold red + charcoal — energetic, van-and-action brand.
    colors: { primary: "#dc2626", primaryDark: "#991b1b", accent: "#1e293b", accentLight: "#334155" },
    allowBankTransfer: false,
    allowAutomatedSms: false,
  },
];

export const BRAND_BY_SLUG: Record<string, Brand> = Object.fromEntries(BRANDS.map((b) => [b.slug, b]));

/** Resolve a brand from a request hostname — used by middleware and any
 *  server component that needs to know which storefront it's rendering. */
export function brandForHost(host: string | null | undefined): Brand {
  if (!host) return AMPLE_BRAND;
  const clean = host.toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
  const match = BRANDS.find((b) => b.domain.replace(/^www\./, "") === clean);
  return match ?? AMPLE_BRAND;
}

/**
 * A brand marketing page's full <head> metadata (title, description, OG,
 * Twitter, author). The root layout's own metadata defaults to Ample, so
 * without this override a shared Thatcham Movers/Newbury Removals/ManyVans
 * link would preview as "Ample Removals" everywhere it's shared.
 */
export function brandPageMetadata(brand: Brand, title: string, description: string, path: string) {
  const url = `https://${brand.domain}${path}`;
  return {
    title: { absolute: title },
    description,
    authors: [{ name: brand.name }],
    alternates: { canonical: url },
    openGraph: {
      type: "website" as const,
      locale: "en_GB",
      url,
      siteName: brand.name,
      title,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${brand.name} — ${brand.tagline}` }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}
