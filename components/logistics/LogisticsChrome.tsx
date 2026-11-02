"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";
import { LOGISTICS } from "@/lib/logistics";
import { PrimaryButton } from "@/components/logistics/LogisticsKit";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/businesses", label: "For Businesses" },
  { href: "/drivers", label: "For Drivers" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

/** The wordmark — a mono route-code treatment rather than a rounded logo badge. */
function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="flex h-9 w-9 items-center justify-center text-sm font-black"
        style={{ background: LOGISTICS.colors.ink, color: LOGISTICS.colors.blue, fontFamily: "var(--font-logistics-mono)" }}
      >
        AL
      </span>
      <span className="text-lg font-extrabold uppercase tracking-tight" style={{ fontFamily: "var(--font-logistics-display)", color: LOGISTICS.colors.ink }}>
        Ample <span style={{ color: LOGISTICS.colors.blue }}>Logistics</span>
      </span>
    </span>
  );
}

export function LogisticsHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm" style={{ borderColor: LOGISTICS.colors.line }}>
      <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-semibold uppercase tracking-wide text-slate-600 transition-colors hover:text-black"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a href={LOGISTICS.phoneHref} className="flex items-center gap-1.5 text-sm font-bold" style={{ color: LOGISTICS.colors.ink }}>
            <Phone className="h-4 w-4" style={{ color: LOGISTICS.colors.blue }} /> {LOGISTICS.phone}
          </a>
          <PrimaryButton href="/businesses">Request a Driver</PrimaryButton>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-white px-6 py-4 lg:hidden" style={{ borderColor: LOGISTICS.colors.line }}>
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-2 py-2 text-base font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-50"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <a
            href={LOGISTICS.phoneHref}
            className="mt-3 flex items-center justify-center gap-1.5 border px-2 py-2.5 text-sm font-bold"
            style={{ borderColor: LOGISTICS.colors.line, color: LOGISTICS.colors.ink }}
          >
            <Phone className="h-4 w-4" style={{ color: LOGISTICS.colors.blue }} /> {LOGISTICS.phone}
          </a>
          <Link
            href="/businesses"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center px-5 py-3 text-sm font-bold uppercase tracking-wide text-white"
            style={{ background: LOGISTICS.colors.blue }}
          >
            Request a Driver
          </Link>
          <Link
            href="/drivers"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center border px-5 py-3 text-sm font-bold uppercase tracking-wide"
            style={{ borderColor: LOGISTICS.colors.ink, color: LOGISTICS.colors.ink }}
          >
            Find Driving Jobs
          </Link>
        </div>
      )}
    </header>
  );
}

export function LogisticsFooter() {
  return (
    <footer className="relative overflow-hidden px-6 py-16 text-white" style={{ background: LOGISTICS.colors.ink }}>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundImage: `repeating-linear-gradient(135deg, ${LOGISTICS.colors.blue} 0 14px, ${LOGISTICS.colors.navy} 14px 28px)` }}
      />
      <div className="container relative mx-auto grid max-w-6xl gap-10 text-sm text-slate-400 sm:grid-cols-4">
        <div>
          <span
            className="flex h-9 w-9 items-center justify-center text-sm font-black"
            style={{ background: "rgba(255,255,255,0.08)", color: LOGISTICS.colors.blue, fontFamily: "var(--font-logistics-mono)" }}
          >
            AL
          </span>
          <p className="mt-3 text-base font-extrabold uppercase tracking-tight text-white" style={{ fontFamily: "var(--font-logistics-display)" }}>
            Ample Logistics
          </p>
          <p className="mt-3 text-slate-400">HGV driver recruitment and temporary staffing across Berkshire.</p>
          <a href={LOGISTICS.phoneHref} className="mt-3 inline-flex items-center gap-1.5 font-semibold text-white hover:underline">
            <Phone className="h-3.5 w-3.5" /> {LOGISTICS.phone}
          </a>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50" style={{ fontFamily: "var(--font-logistics-mono)" }}>Navigate</p>
          <ul className="mt-3 space-y-2">
            {NAV_LINKS.map((l) => (<li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50" style={{ fontFamily: "var(--font-logistics-mono)" }}>Get Started</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/businesses" className="hover:text-white">Request a Driver</Link></li>
            <li><Link href="/drivers" className="hover:text-white">Register as a Driver</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50" style={{ fontFamily: "var(--font-logistics-mono)" }}>Legal</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/privacy-notice" className="hover:text-white">Privacy Notice</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms and Conditions</Link></li>
          </ul>
        </div>
      </div>
      <p
        className="container relative mx-auto mt-10 max-w-6xl border-t pt-6 text-xs text-slate-500"
        style={{ borderColor: LOGISTICS.colors.lineOnDark, fontFamily: "var(--font-logistics-mono)" }}
      >
        © {new Date().getFullYear()} Ample Logistics — part of the Ample Removals group. All rights reserved.
      </p>
    </footer>
  );
}
