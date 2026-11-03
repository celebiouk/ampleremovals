"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { Phone } from "lucide-react";
import { LOGISTICS } from "@/lib/logistics";
import { Eyebrow, PrimaryButton, GhostButton, Plate } from "@/components/logistics/LogisticsKit";
import { RouteMap } from "@/components/logistics/RouteMap";

// Content stays visible without JS: the hero animates from a slightly
// offset position, never from opacity 0.
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { y: 14 },
  show: { y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const MANIFEST = [
  { label: "Coverage", value: "Berkshire, England" },
  { label: "Priority", value: "Urgent requests first" },
  { label: "Checks", value: "Licence + CPC verified" },
];

/**
 * Homepage hero — "the route". The headline sits left; on the right a
 * schematic of the M4 corridor with a truck running it stands in for the
 * stock photo or stat tiles a haulage site would normally use. The manifest
 * strip beneath is coverage/process fact, not invented metrics.
 */
export function LogisticsHero() {
  return (
    <section className="relative overflow-hidden text-white" style={{ background: LOGISTICS.colors.ink }}>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundImage: `repeating-linear-gradient(135deg, ${LOGISTICS.colors.blue} 0 14px, ${LOGISTICS.colors.navy} 14px 28px)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 opacity-[0.06]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0 2px, transparent 2px 24px)" }}
      />

      <div className="container relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:py-24">
        <motion.div initial="hidden" animate="show" variants={container}>
          <motion.div variants={item}>
            <Eyebrow dark>HGV Driver Agency — Berkshire, England</Eyebrow>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 text-[clamp(3rem,8.4vw,6.2rem)] font-black uppercase leading-[0.9] tracking-tight"
            style={{ fontFamily: "var(--font-logistics-display)" }}
          >
            Drivers On
            <br />
            <span style={{ color: "#3fbf6b" }}>The Road,</span>
            <br />
            Not On Hold.
          </motion.h1>

          <motion.p variants={item} className="mt-7 max-w-lg text-lg text-white/70">
            Ample Logistics connects businesses across Berkshire with qualified HGV drivers for temporary cover, urgent staffing, and flexible logistics support.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryButton href="/businesses">Request a Driver</PrimaryButton>
            <GhostButton href="/drivers">Find Driving Work</GhostButton>
          </motion.div>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a href={LOGISTICS.phoneHref} className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
              <Phone className="h-4 w-4" style={{ color: "#3fbf6b" }} />
              {LOGISTICS.phone}
            </a>
            <span className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45" style={{ fontFamily: "var(--font-logistics-mono)" }}>Licences</span>
              <Plate>C+E</Plate>
              <Plate>C</Plate>
              <Plate>C1</Plate>
            </span>
          </motion.div>
        </motion.div>

        {/* The route card */}
        <motion.div
          initial={{ y: 24 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
          className="overflow-hidden rounded-[6px] border"
          style={{ borderColor: LOGISTICS.colors.lineOnDark, background: "rgba(255,255,255,0.035)" }}
        >
          <div className="flex items-center justify-between border-b px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50" style={{ borderColor: LOGISTICS.colors.lineOnDark, fontFamily: "var(--font-logistics-mono)" }}>
            <span>Route 001 — Berkshire</span>
            <span>M4 corridor</span>
          </div>
          <RouteMap className="block h-auto w-full" />
          <div className="grid grid-cols-3 border-t" style={{ borderColor: LOGISTICS.colors.lineOnDark }}>
            {MANIFEST.map((m, i) => (
              <div key={m.label} className="px-5 py-4" style={{ borderLeft: i ? `1px solid ${LOGISTICS.colors.lineOnDark}` : undefined }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40" style={{ fontFamily: "var(--font-logistics-mono)" }}>{m.label}</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-white">{m.value}</p>
              </div>
            ))}
          </div>
          <p className="border-t px-5 py-2.5 text-[10px] uppercase tracking-wider text-white/35" style={{ borderColor: LOGISTICS.colors.lineOnDark, fontFamily: "var(--font-logistics-mono)" }}>
            Schematic only — not to scale. Coverage subject to availability.
          </p>
        </motion.div>
      </div>

      <div className="container relative mx-auto max-w-7xl px-6 pb-6">
        <Link href="/about" className="text-xs font-bold uppercase tracking-wide text-white/45 hover:text-white">
          Part of the Ample Removals group →
        </Link>
      </div>
    </section>
  );
}
