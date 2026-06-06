"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Star,
  ShieldCheck,
  BadgeCheck,
  Receipt,
  Clock,
  Check,
  ClipboardList,
  PhoneCall,
  Truck,
  Quote,
} from "lucide-react";
import { PostcodeSearch } from "@/components/shared/PostcodeSearch";
import { SERVICES } from "@/lib/services";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const inView = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
  transition: { duration: 0.6, ease: EASE },
};

const HOW_IT_WORKS = [
  {
    icon: ClipboardList,
    title: "Enter your postcode",
    description:
      "Tell us where you're moving from and to, and a few details about the job.",
  },
  {
    icon: PhoneCall,
    title: "Get your fixed quote",
    description:
      "A real person reviews your move and confirms a clear, all-in price — no surprises.",
  },
  {
    icon: Truck,
    title: "Sit back on move day",
    description:
      "Your vetted, fully insured crew turns up on time and handles everything, end to end.",
  },
];

const WHY_US = [
  {
    icon: ShieldCheck,
    title: "Fully insured",
    description: "Goods-in-transit and public liability cover on every job.",
  },
  {
    icon: BadgeCheck,
    title: "Vetted professionals",
    description: "Background-checked, trained movers and cleaners.",
  },
  {
    icon: Receipt,
    title: "Transparent pricing",
    description: "Fixed quotes agreed up front. No hidden fees, ever.",
  },
  {
    icon: Clock,
    title: "On time, every time",
    description: "Punctual crews and clear communication from quote to keys.",
  },
];

const TRUST = [
  "Fully insured",
  "No deposit to quote",
  "DBS-checked teams",
  "Free, no-obligation quotes",
];

export default function HomePage() {
  return (
    <>
      {/* ════════════════ HERO ════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-purple-50 to-white pb-16 pt-28 lg:pb-24 lg:pt-36">
        <div className="absolute -right-32 -top-24 -z-10 h-[30rem] w-[30rem] rounded-full bg-brand-purple-100/70 blur-3xl" />
        <div className="absolute -left-24 top-40 -z-10 h-80 w-80 rounded-full bg-brand-green-100/60 blur-3xl" />

        <div className="container grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left: copy + postcode (CSS entrance — always SSR-visible) */}
          <div>
            <div
              className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-brand-purple-100 bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-purple-800 shadow-sm"
              style={{ animationDelay: "0ms" }}
            >
              <span className="flex items-center gap-0.5 text-brand-green-600">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </span>
              Rated 4.9 / 5 by 2,000+ movers
            </div>

            <h1
              className="animate-fade-up mt-6 font-display text-[clamp(2.5rem,5.5vw,4.5rem)] font-extrabold leading-[1.02] tracking-tight text-brand-purple-950"
              style={{ animationDelay: "90ms" }}
            >
              Moving day,
              <br />
              <span className="text-brand-green-600">minus the stress.</span>
            </h1>

            <p
              className="animate-fade-up mt-5 max-w-md text-lg leading-relaxed text-slate-600"
              style={{ animationDelay: "180ms" }}
            >
              Professional, fully insured removals, clearances and cleaning
              across the UK. Enter your postcode for an instant, no-obligation
              quote.
            </p>

            <div
              className="animate-fade-up mt-8"
              style={{ animationDelay: "270ms" }}
            >
              <PostcodeSearch />
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <Check className="h-4 w-4 text-brand-green-600" />
                Free quote in minutes — no payment details needed.
              </p>
            </div>

            <div
              className="animate-fade-up mt-8 flex flex-wrap items-center gap-x-6 gap-y-2"
              style={{ animationDelay: "360ms" }}
            >
              {TRUST.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600"
                >
                  <ShieldCheck className="h-4 w-4 text-brand-green-600" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: hero photo + floating cards */}
          <div
            className="animate-fade-up relative"
            style={{ animationDelay: "220ms" }}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl shadow-brand-purple-900/20 ring-1 ring-black/5">
              <Image
                src="/heroimage.png"
                alt="Ample Removals movers loading furniture into a branded van"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* floating review badge */}
            <div className="absolute -left-4 bottom-6 hidden rounded-2xl bg-white p-4 shadow-xl shadow-brand-purple-900/15 ring-1 ring-black/5 sm:block">
              <div className="flex items-center gap-1 text-brand-green-600">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-1 text-sm font-bold text-brand-purple-950">
                “Brilliant, careful team”
              </p>
              <p className="text-xs text-slate-500">2,000+ verified reviews</p>
            </div>

            {/* floating insured chip */}
            <div className="absolute -right-3 top-6 hidden items-center gap-2 rounded-full bg-brand-purple-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl sm:flex">
              <ShieldCheck className="h-5 w-5 text-brand-green-400" />
              Fully insured
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ SERVICES ════════════════ */}
      <section id="services" className="bg-white py-20 lg:py-28">
        <div className="container">
          <motion.div {...inView} className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 font-bold uppercase tracking-[0.18em] text-brand-green-600">
              Our services
            </p>
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-brand-purple-950 sm:text-5xl">
              One trusted team for every move
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From a single sofa to a full home or office — we&apos;ve got the
              right crew and the right van.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: (i % 3) * 0.08, ease: EASE }}
              >
                <Link
                  href={`/booking/${s.slug}`}
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple-200 hover:shadow-xl hover:shadow-brand-purple-900/10"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple-50 text-brand-purple-800 transition-colors duration-300 group-hover:bg-brand-purple-800 group-hover:text-white">
                    <s.icon className="h-7 w-7" />
                  </span>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-bold text-brand-purple-950">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-600">
                      {s.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-green-700">
                    Get a quote
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            ))}

            {/* CTA tile */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: 0.16, ease: EASE }}
            >
              <Link
                href="/booking/removals"
                className="flex h-full flex-col justify-between gap-4 rounded-2xl bg-gradient-to-br from-brand-purple-800 to-brand-purple-950 p-7 text-white shadow-lg shadow-brand-purple-900/20 transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <PhoneCall className="h-7 w-7 text-brand-green-400" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold">
                    Prefer to talk it through?
                  </h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-white/70">
                    Call our friendly team on 07344 683477 — we&apos;re happy to
                    help.
                  </p>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section className="bg-brand-purple-50 py-20 lg:py-28">
        <div className="container">
          <motion.div {...inView} className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 font-bold uppercase tracking-[0.18em] text-brand-green-600">
              How it works
            </p>
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-brand-purple-950 sm:text-5xl">
              A quote in three easy steps
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: EASE }}
                className="relative rounded-3xl border border-brand-purple-100 bg-white p-8 shadow-sm"
              >
                <span className="absolute right-6 top-5 font-display text-5xl font-extrabold text-brand-purple-100">
                  {`0${i + 1}`}
                </span>
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple-800 text-white shadow-lg shadow-brand-purple-800/25">
                  <step.icon className="h-7 w-7" />
                </span>
                <h3 className="mt-6 font-display text-xl font-bold text-brand-purple-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-[0.96rem] leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ WHY CHOOSE US ════════════════ */}
      <section className="bg-white py-20 lg:py-28">
        <div className="container grid items-center gap-14 lg:grid-cols-2">
          <motion.div {...inView}>
            <p className="mb-3 font-bold uppercase tracking-[0.18em] text-brand-green-600">
              Why Ample
            </p>
            <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-purple-950 sm:text-5xl">
              Movers you can
              <br />
              actually trust
            </h2>
            <p className="mt-5 max-w-md text-lg text-slate-600">
              Thousands of UK households and businesses choose Ample because we
              treat every move like it&apos;s our own — careful, on time, and
              fairly priced.
            </p>
            <Link
              href="/booking/removals"
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-purple-800 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-purple-800/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-purple-900"
            >
              Get your free quote
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2">
            {WHY_US.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green-600">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-brand-purple-950">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ REVIEW STRIP ════════════════ */}
      <section className="bg-brand-purple-50 py-20">
        <div className="container">
          <motion.figure {...inView} className="mx-auto max-w-3xl text-center">
            <Quote className="mx-auto h-10 w-10 text-brand-purple-300" />
            <blockquote className="mt-6 font-display text-2xl font-bold leading-snug text-brand-purple-950 sm:text-3xl">
              “Booked in 5 minutes, the price was exactly as quoted, and the team
              were friendly and careful with everything. Genuinely the easiest
              move we&apos;ve ever had.”
            </blockquote>
            <figcaption className="mt-6 flex items-center justify-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-purple-800 font-display font-bold text-white">
                SJ
              </span>
              <span className="text-left">
                <span className="block font-bold text-brand-purple-950">
                  Sarah J.
                </span>
                <span className="flex items-center gap-0.5 text-brand-green-600">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </span>
              </span>
            </figcaption>
          </motion.figure>
        </div>
      </section>

      {/* ════════════════ CTA BAND (postcode again) ════════════════ */}
      <section className="bg-white py-20">
        <div className="container">
          <motion.div
            {...inView}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-purple-800 via-brand-purple-900 to-brand-purple-950 px-8 py-16 shadow-2xl shadow-brand-purple-900/30 sm:px-14"
          >
            <div className="absolute -left-16 top-0 h-64 w-64 rounded-full bg-brand-green-600/20 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-brand-purple-500/30 blur-3xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <div>
                <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                  Get your free quote today
                </h2>
                <p className="mt-3 max-w-md text-white/70">
                  Pop in your postcode and we&apos;ll do the rest. No deposit, no
                  obligation, no hassle.
                </p>
              </div>
              <div className="lg:justify-self-end">
                <PostcodeSearch variant="dark" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
