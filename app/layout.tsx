import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ample Removals — Professional Removal Services UK",
    template: "%s | Ample Removals",
  },
  description:
    "Professional removal services across the UK. House removals, man and van, house clearance, cleaning and end of tenancy services. Get a free quote in minutes.",
  keywords: [
    "removal company",
    "house removals",
    "man and van",
    "house clearance",
    "end of tenancy cleaning",
    "moving company UK",
    "removal services",
    "professional movers",
    // Primary SEO service keywords
    "Home Removals",
    "Man and Van",
    "Business Moves",
    "Commercial Moves",
    "Long Distance Removals",
    "Business removals",
    "Removals",
  ],
  authors: [{ name: "Ample Removals" }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    siteName: "Ample Removals",
    title: "Ample Removals — Professional Removal Services UK",
    description:
      "Professional removal services across the UK. Get a free quote in minutes.",
    // Generated at app/opengraph-image.tsx (the old /og-image.png never existed,
    // which is why shared links showed no image).
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Ample Removals - Professional Removal Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ample Removals — Professional Removal Services UK",
    description:
      "Professional removal services across the UK. Get a free quote in minutes.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // No icons field here — it would override every nested icon.tsx
  // file-convention favicon (brands, logistics) with Ample's own /fav.png,
  // and Next appends a content hash to those generated routes that a
  // hardcoded override can't match. Ample's own pages set it explicitly
  // below, in (public)/layout.tsx and (admin)/admin/layout.tsx instead.
  manifest: "/site.webmanifest",
  // Google Search Console site-ownership verification (HTML tag method) —
  // these domains' DNS isn't on Vercel, so a TXT record isn't an option.
  // Lives in the root layout (shared by every domain this app serves) so
  // each brand/logistics domain's own Search Console property verifies
  // against this same tag — one entry per domain, added here as it's
  // verified. Safe to have all of them live on every domain at once.
  verification: {
    google: [
      "jTgByxhwwzgAm8sZZ14OR2uBBE297o1SkiGdXbtN0D4", // thatchammovers.co.uk
    ],
  },
};

// Ample's own MovingCompany JSON-LD lives in app/(public)/layout.tsx, not
// here — the root layout also wraps the white-label brand pages (which emit
// their own correct MovingCompany + FAQPage schema via BrandPageShell) and
// the admin, so putting Ample's business schema here would tell Google two
// different businesses own the same page.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(bricolage.variable, jakarta.variable)}>
      <body className="font-sans antialiased">
        <GoogleAnalytics />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
