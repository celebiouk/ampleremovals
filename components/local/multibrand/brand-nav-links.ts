import type { BrandNavLink } from "@/components/local/multibrand/BrandNavbar";

/** The standard nav link set every brand gets — service pages plus the
 *  shared About/Contact/Tips pages. Pass this straight to BrandNavbar/
 *  BrandChrome unless a brand's page set genuinely differs. Deliberately
 *  NOT in BrandNavbar.tsx — that file has "use client", which would turn
 *  this plain data function into a client reference unusable from the
 *  Server Components (BrandChrome, BrandPageShell) that call it directly. */
export function standardBrandNavLinks(): BrandNavLink[] {
  return [
    { label: "Removals", href: "/" },
    { label: "Man and Van", href: "/man-and-van" },
    { label: "House Clearance", href: "/house-clearance" },
    { label: "Tips & Advice", href: "/tips" },
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
  ];
}
