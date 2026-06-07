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
    images: [
      {
        url: "/og-image.png",
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
    images: ["/og-image.png"],
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
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

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
