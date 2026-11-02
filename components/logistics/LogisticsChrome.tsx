"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Truck } from "lucide-react";
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
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white">
      <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: LOGISTICS.colors.navy }}>
            <Truck className="h-5 w-5 text-white" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight" style={{ color: LOGISTICS.colors.navy }}>
            AMPLE <span style={{ color: LOGISTICS.colors.blue }}>LOGISTICS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-semibold text-slate-700 hover:text-slate-950">{l.label}</Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/drivers" className="text-sm font-semibold" style={{ color: LOGISTICS.colors.navy }}>Find Driving Jobs</Link>
          <Link href="/businesses" className="rounded-lg px-5 py-2.5 text-sm font-bold text-white" style={{ background: LOGISTICS.colors.blue }}>Request a Driver</Link>
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
          <Link href="/businesses" onClick={() => setOpen(false)} className="mt-4 flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white" style={{ background: LOGISTICS.colors.blue }}>Request a Driver</Link>
          <Link href="/drivers" onClick={() => setOpen(false)} className="mt-2 flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-bold" style={{ borderColor: LOGISTICS.colors.navy, color: LOGISTICS.colors.navy }}>Find Driving Jobs</Link>
        </div>
      )}
    </header>
  );
}

export function LogisticsFooter() {
  return (
    <footer className="border-t border-slate-100 px-6 py-10" style={{ background: LOGISTICS.colors.navy }}>
      <div className="container mx-auto grid max-w-6xl gap-8 text-sm text-slate-300 sm:grid-cols-4">
        <div>
          <p className="font-display text-base font-extrabold text-white">AMPLE LOGISTICS</p>
          <p className="mt-2 text-slate-400">HGV driver recruitment and temporary staffing across Berkshire.</p>
        </div>
        <div>
          <p className="font-semibold text-white">Navigate</p>
          <ul className="mt-2 space-y-1.5">
            {NAV_LINKS.map((l) => (<li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Get Started</p>
          <ul className="mt-2 space-y-1.5">
            <li><Link href="/businesses" className="hover:text-white">Request a Driver</Link></li>
            <li><Link href="/drivers" className="hover:text-white">Register as a Driver</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Legal</p>
          <ul className="mt-2 space-y-1.5">
            <li><Link href="/privacy-notice" className="hover:text-white">Privacy Notice</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms and Conditions</Link></li>
          </ul>
        </div>
      </div>
      <p className="container mx-auto mt-8 max-w-6xl border-t border-white/10 pt-6 text-xs text-slate-500">
        © {new Date().getFullYear()} Ample Logistics. All rights reserved.
      </p>
    </footer>
  );
}
