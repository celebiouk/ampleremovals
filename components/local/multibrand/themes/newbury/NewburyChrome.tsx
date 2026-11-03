"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Menu, Phone, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Brand } from "@/lib/brands";
import type { BrandNavLink } from "@/components/local/multibrand/BrandNavbar";

/** White sticky header with the market-stall awning hanging beneath it. */
export function NewburyHeader({
  brand,
  logo,
  homeHref,
  links,
  quoteHref,
}: {
  brand: Brand;
  logo: ReactNode;
  homeHref: string;
  links: BrandNavLink[];
  quoteHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="relative bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
          <Link href={homeHref} className="shrink-0" onClick={() => setOpen(false)}>
            {logo}
          </Link>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-full px-4 py-2 text-[15px] font-semibold text-[var(--nb-green-deep)] transition-colors hover:bg-[var(--nb-sage-100)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 xl:flex">
            <a href={brand.phoneHref} className="hidden items-center gap-2 whitespace-nowrap text-[15px] font-bold text-[var(--nb-green-deep)] 2xl:flex">
              <Phone className="h-4 w-4 text-[var(--nb-gold)]" /> {brand.phone}
            </a>
            <Link
              href={quoteHref}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[var(--nb-green)] px-6 py-3 text-[15px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(20,83,45,0.7)] transition-colors hover:bg-[var(--nb-green-deep)]"
            >
              Get a free Quote <ArrowRight className="h-4 w-4 text-[var(--nb-gold-lite)]" />
            </Link>
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 rounded-full p-2 text-[var(--nb-green-deep)] xl:hidden"
          >
            {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-[var(--nb-sage-200)] bg-white px-5 pb-6 pt-3 xl:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="nb-display rounded-2xl px-4 py-3 text-xl text-[var(--nb-green-deep)] hover:bg-[var(--nb-sage-100)]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Link
              href={quoteHref}
              onClick={() => setOpen(false)}
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[var(--nb-green)] px-5 py-3.5 font-bold text-white"
            >
              Get a free Quote <ArrowRight className="h-4 w-4 text-[var(--nb-gold-lite)]" />
            </Link>
          </div>
        )}
      </div>
      {/* the awning: purely decorative, hangs over the page content */}
      <div className="nb-awning pointer-events-none absolute inset-x-0 top-full" aria-hidden="true" />
    </header>
  );
}

export function NewburyFooter({ brand, logoOnDark, links }: { brand: Brand; logo: ReactNode; logoOnDark: ReactNode; links: BrandNavLink[] }) {
  return (
    <footer className="rounded-t-[2.5rem] bg-[var(--nb-green)] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          {logoOnDark}
          <p className="mt-5 max-w-sm text-white/80">{brand.tagline}. Removals, man and van and house clearance in and around {brand.towns.join(" & ")}.</p>
          <a href={brand.phoneHref} className="nb-display mt-6 inline-block text-4xl text-[var(--nb-gold-lite)] hover:underline">
            {brand.phone}
          </a>
        </div>

        <nav className="lg:col-span-3" aria-label="Footer">
          <p className="nb-display text-lg text-[var(--nb-gold-lite)]">Explore</p>
          <ul className="mt-4 space-y-2.5">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-medium text-white/85 hover:text-white hover:underline">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <p className="nb-display text-lg text-[var(--nb-gold-lite)]">Find us</p>
          <p className="mt-4 flex items-start gap-2 text-white/85">
            <MapPin className="mt-1 h-4 w-4 shrink-0" />
            {brand.address.line1}, {brand.address.town}, {brand.address.postcode}
          </p>
          <p className="mt-3 text-white/70">Fully insured on every job. A fixed price before you book.</p>
        </div>
      </div>
      <div className="border-t border-white/15 px-5 py-5 text-xs text-white/60 md:px-8">
        <p className="mx-auto max-w-7xl">© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
