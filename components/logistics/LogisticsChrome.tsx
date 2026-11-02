"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Truck, Phone } from "lucide-react";
import { LOGISTICS } from "@/lib/logistics";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/businesses", label: "For Businesses" },
  { href: "/drivers", label: "For Drivers" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export function LogisticsHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
            style={{ background: `linear-gradient(135deg, ${LOGISTICS.colors.navy}, ${LOGISTICS.colors.blue})` }}
          >
            <Truck className="h-5 w-5 text-white" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight" style={{ color: LOGISTICS.colors.navy }}>
            AMPLE <span style={{ color: LOGISTICS.colors.blue }}>LOGISTICS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950">{l.label}</Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <a href={LOGISTICS.phoneHref} className="flex items-center gap-1.5 text-sm font-bold" style={{ color: LOGISTICS.colors.navy }}>
            <Phone className="h-4 w-4" style={{ color: LOGISTICS.colors.blue }} /> {LOGISTICS.phone}
          </a>
          <Link
            href="/businesses"
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
            style={{ background: `linear-gradient(135deg, ${LOGISTICS.colors.navy}, ${LOGISTICS.colors.blue})` }}
          >
            Request a Driver
          </Link>
        </div>

        <button type="button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50">{l.label}</Link>
            ))}
          </nav>
          <a href={LOGISTICS.phoneHref} className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 py-2.5 text-sm font-bold" style={{ color: LOGISTICS.colors.navy }}>
            <Phone className="h-4 w-4" style={{ color: LOGISTICS.colors.blue }} /> {LOGISTICS.phone}
          </a>
          <Link
            href="/businesses"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${LOGISTICS.colors.navy}, ${LOGISTICS.colors.blue})` }}
          >
            Request a Driver
          </Link>
          <Link href="/drivers" onClick={() => setOpen(false)} className="mt-2 flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-bold" style={{ borderColor: LOGISTICS.colors.navy, color: LOGISTICS.colors.navy }}>Find Driving Jobs</Link>
        </div>
      )}
    </header>
  );
}

export function LogisticsFooter() {
  return (
    <footer className="relative overflow-hidden px-6 py-14 text-white" style={{ background: `linear-gradient(160deg, ${LOGISTICS.colors.charcoal}, ${LOGISTICS.colors.navy})` }}>
      <div className="container relative mx-auto grid max-w-6xl gap-10 text-sm text-slate-300 sm:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: LOGISTICS.colors.blue }}>
              <Truck className="h-5 w-5 text-white" />
            </span>
            <p className="font-display text-base font-extrabold text-white">AMPLE LOGISTICS</p>
          </div>
          <p className="mt-3 text-slate-400">HGV driver recruitment and temporary staffing across Berkshire.</p>
          <a href={LOGISTICS.phoneHref} className="mt-3 inline-flex items-center gap-1.5 font-semibold text-white hover:underline">
            <Phone className="h-3.5 w-3.5" /> {LOGISTICS.phone}
          </a>
        </div>
        <div>
          <p className="font-semibold text-white">Navigate</p>
          <ul className="mt-3 space-y-2">
            {NAV_LINKS.map((l) => (<li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Get Started</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/businesses" className="hover:text-white">Request a Driver</Link></li>
            <li><Link href="/drivers" className="hover:text-white">Register as a Driver</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Legal</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/privacy-notice" className="hover:text-white">Privacy Notice</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms and Conditions</Link></li>
          </ul>
        </div>
      </div>
      <p className="container relative mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-xs text-slate-500">
        © {new Date().getFullYear()} Ample Logistics, part of the Ample Removals group. All rights reserved.
      </p>
    </footer>
  );
}
