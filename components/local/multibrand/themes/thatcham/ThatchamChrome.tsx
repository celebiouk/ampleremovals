"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Menu, Phone, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Brand } from "@/lib/brands";
import type { BrandNavLink } from "@/components/local/multibrand/BrandNavbar";

export function ThatchamHeader({
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
    <header className="sticky top-0 z-50 border-b border-[var(--th-line)] bg-[var(--th-paper)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Link href={homeHref} className="shrink-0" onClick={() => setOpen(false)}>
          {logo}
        </Link>

        <nav className="hidden items-center gap-7 xl:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap border-b-2 border-transparent py-1 text-[15px] font-semibold text-[var(--th-navy)] transition-colors hover:border-[var(--th-amber)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 xl:flex">
          <a href={brand.phoneHref} className="hidden items-center gap-2 whitespace-nowrap text-[15px] font-bold text-[var(--th-navy)] 2xl:flex">
            <Phone className="h-4 w-4 text-[var(--th-amber)]" /> {brand.phone}
          </a>
          <Link
            href={quoteHref}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-[10px] bg-[var(--th-navy)] px-5 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-[var(--th-navy-deep)]"
          >
            Get a free Quote <ArrowRight className="h-4 w-4 text-[var(--th-amber-light)]" />
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 p-2 text-[var(--th-navy)] xl:hidden"
        >
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--th-line)] bg-[var(--th-paper-lift)] px-5 pb-6 pt-3 xl:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="th-display border-b border-dotted border-[var(--th-navy)]/30 py-3.5 text-[1.5rem] text-[var(--th-navy)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={quoteHref}
            onClick={() => setOpen(false)}
            className="mt-5 flex items-center justify-center gap-2 rounded-[10px] bg-[var(--th-navy)] px-5 py-3.5 font-bold text-white"
          >
            Get a free Quote <ArrowRight className="h-4 w-4 text-[var(--th-amber-light)]" />
          </Link>
        </div>
      )}
    </header>
  );
}

export function ThatchamFooter({ brand, logoOnDark, links }: { brand: Brand; logo: ReactNode; logoOnDark: ReactNode; links: BrandNavLink[] }) {
  return (
    <footer className="bg-[var(--th-navy)] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          {logoOnDark}
          <p className="th-display th-italic mt-6 max-w-sm text-2xl text-white/90">{brand.tagline}.</p>
          <a href={brand.phoneHref} className="mt-6 inline-block text-3xl font-bold text-[var(--th-amber-light)] hover:underline">
            {brand.phone}
          </a>
        </div>

        <nav className="lg:col-span-3" aria-label="Footer">
          <p className="th-caps text-[11px] text-[var(--th-amber-light)]">Find your way</p>
          <ul className="mt-4 space-y-2.5">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-medium text-white/80 hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <p className="th-caps text-[11px] text-[var(--th-amber-light)]">Visit us</p>
          <p className="mt-4 flex items-start gap-2 text-white/85">
            <MapPin className="mt-1 h-4 w-4 shrink-0" />
            {brand.address.line1}, {brand.address.town}, {brand.address.postcode}
          </p>
          <p className="mt-3 text-white/65">Fully insured on every job. A fixed price before you book.</p>
        </div>
      </div>
      <div className="border-t border-white/15 px-5 py-5 text-xs text-white/55 md:px-8">
        <p className="mx-auto max-w-7xl">© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
