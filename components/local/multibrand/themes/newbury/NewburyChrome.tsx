"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Menu, Phone, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Brand } from "@/lib/brands";
import type { BrandNavLink } from "@/components/local/multibrand/BrandNavbar";

/** Dark sticky header with a gold hairline; small-caps navigation. */
export function NewburyHeader({
  brand,
  logoOnDark,
  homeHref,
  links,
  quoteHref,
}: {
  brand: Brand;
  logoOnDark: ReactNode;
  homeHref: string;
  links: BrandNavLink[];
  quoteHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--nb-hair)] bg-[var(--nb-green)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <Link href={homeHref} className="shrink-0" onClick={() => setOpen(false)}>
          {logoOnDark}
        </Link>

        <nav className="hidden items-center gap-7 xl:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap border-b border-transparent py-1 text-[12px] font-medium uppercase tracking-[0.18em] text-[var(--nb-ivory)]/85 transition-colors hover:border-[var(--nb-gold-lite)] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 xl:flex">
          <a href={brand.phoneHref} className="hidden items-center gap-2 whitespace-nowrap text-sm font-medium tracking-wide text-[var(--nb-ivory)] 2xl:flex">
            <Phone className="h-4 w-4 text-[var(--nb-gold-lite)]" /> {brand.phone}
          </a>
          <Link
            href={quoteHref}
            className="inline-flex items-center gap-2 whitespace-nowrap border border-[var(--nb-gold)] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--nb-gold-lite)] transition-colors hover:bg-[var(--nb-gold)] hover:text-[var(--nb-green)]"
          >
            Get a free Quote <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 p-2 text-[var(--nb-ivory)] xl:hidden"
        >
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--nb-hair)] bg-[var(--nb-green-2)] px-5 pb-7 pt-3 xl:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="nb-display nb-italic border-b border-[var(--nb-hair)] py-3.5 text-[1.6rem] text-[var(--nb-ivory)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={quoteHref}
            onClick={() => setOpen(false)}
            className="mt-6 flex items-center justify-center gap-2 bg-[var(--nb-gold)] px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--nb-green)]"
          >
            Get a free Quote <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </header>
  );
}

export function NewburyFooter({ brand, logoOnDark, links }: { brand: Brand; logo: ReactNode; logoOnDark: ReactNode; links: BrandNavLink[] }) {
  return (
    <footer className="bg-[var(--nb-green)] text-[var(--nb-ivory)]">
      <div className="nb-silks" aria-hidden="true" />
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-16 text-center md:px-8">
        {logoOnDark}
        <p className="nb-display nb-italic mt-6 text-2xl text-[var(--nb-ivory)]/85">{brand.tagline}</p>

        <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3" aria-label="Footer">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-[12px] font-medium uppercase tracking-[0.2em] text-[var(--nb-ivory)]/75 hover:text-[var(--nb-gold-lite)]">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nb-rule mt-12 w-full max-w-md py-6">
          <a href={brand.phoneHref} className="nb-display text-3xl text-[var(--nb-gold-lite)] hover:underline">{brand.phone}</a>
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-[var(--nb-ivory)]/75">
            <MapPin className="h-4 w-4" /> {brand.address.line1}, {brand.address.town}, {brand.address.postcode}
          </p>
        </div>
        <p className="mt-8 text-xs text-[var(--nb-ivory)]/50">© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
