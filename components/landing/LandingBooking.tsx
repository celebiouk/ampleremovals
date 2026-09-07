"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, ArrowRight, ArrowLeft, Loader2, ShieldCheck, Star, Check, Sparkles,
  Phone, Mail, User, MapPin, Home, CalendarDays, Plus, Minus,
} from "lucide-react";
import { STANDARD_INCLUDES, PREMIUM_INCLUDES, TIER_COPY } from "@/lib/tiers";

/* ── Config ───────────────────────────────────────────────── */

const gbp0 = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n || 0);

const BEDROOMS = [
  { key: "studio", label: "Studio" },
  { key: "1", label: "1 bed" },
  { key: "2", label: "2 bed" },
  { key: "3", label: "3 bed" },
  { key: "4", label: "4 bed" },
  { key: "5+", label: "5+ bed" },
];

/** Curated "most-moved" items — keys match the pricing catalogue so the estimate
 *  is accurate. Anything unusual can be added on the next screen after reserving. */
const KEY_ITEMS = [
  { key: "double_bed", label: "Double bed" },
  { key: "single_bed", label: "Single bed" },
  { key: "wardrobe", label: "Wardrobe" },
  { key: "chest_of_drawers", label: "Chest of drawers" },
  { key: "sofa", label: "Sofa" },
  { key: "dining_table", label: "Dining table" },
  { key: "tv", label: "TV" },
  { key: "fridge_freezer", label: "Fridge freezer" },
  { key: "washing_machine", label: "Washing machine" },
  { key: "bookcase", label: "Bookcase" },
  { key: "office_desk", label: "Desk" },
  { key: "boxes", label: "Boxes / crates" },
];

const POSTCODE_RE = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(?:\+44|0)\d{9,10}$/;

interface Estimate {
  standardTotal: number;
  premiumTotal: number;
  deposit: number;
}

type Qty = Record<string, number>;

/* ── Root wizard ──────────────────────────────────────────── */

export function LandingBooking() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fromPostcode, setFromPostcode] = useState("");
  const [toPostcode, setToPostcode] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [qty, setQty] = useState<Qty>({});
  const [moveDate, setMoveDate] = useState("");

  // Live estimate (fetched on the quote step; refreshes if they go back and edit)
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimating, setEstimating] = useState(false);

  const TOTAL_STEPS = 7;
  const QUOTE_STEP = 6;

  const inventory = useMemo(
    () =>
      KEY_ITEMS.filter((i) => (qty[i.key] ?? 0) > 0).map((i) => ({
        key: i.key,
        label: i.label,
        quantity: qty[i.key],
      })),
    [qty]
  );

  // Fetch the live quote whenever we're on the quote step (or the inputs behind it change).
  const estimateKey = `${bedrooms}|${fromPostcode}|${toPostcode}|${JSON.stringify(inventory)}`;
  useEffect(() => {
    if (step !== QUOTE_STEP) return;
    let cancelled = false;
    setEstimating(true);
    (async () => {
      try {
        const res = await fetch("/api/quote/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bedrooms, inventory, originPostcode: fromPostcode, destinationPostcode: toPostcode }),
        });
        const data = await res.json();
        if (!cancelled && data.success) {
          setEstimate({ standardTotal: data.standardTotal, premiumTotal: data.premiumTotal, deposit: data.deposit });
        }
      } catch {
        /* keep the previous estimate */
      } finally {
        if (!cancelled) setEstimating(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, estimateKey]);

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0: return fullName.trim().length >= 2 && EMAIL_RE.test(email.trim()) && PHONE_RE.test(phone.replace(/[\s()-]/g, ""));
      case 1: return POSTCODE_RE.test(fromPostcode.trim());
      case 2: return POSTCODE_RE.test(toPostcode.trim());
      case 3: return Boolean(bedrooms);
      case 4: return true; // items optional
      case 5: return Boolean(moveDate);
      default: return true;
    }
  }, [step, fullName, email, phone, fromPostcode, toPostcode, bedrooms, moveDate]);

  const next = () => { setError(""); if (canProceed()) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const back = () => { setError(""); setStep((s) => Math.max(s - 1, 0)); };
  const goTo = (s: number) => { setError(""); setStep(s); };

  const reserve = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/booking/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, email, phone,
          originPostcode: fromPostcode, destinationPostcode: toPostcode,
          bedrooms, inventory, isFlexibleDate: false, moveDate,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.bookingId || !data.quoteToken) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      router.push(`/quote/${data.bookingId}/${data.quoteToken}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-50 via-white to-brand-green-50 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        {/* Brand + trust bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple-800 text-white">
              <Truck className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-extrabold text-brand-purple-950">Ample Removals</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-purple-800 shadow-sm">
            <Star className="h-3.5 w-3.5 fill-brand-green-500 text-brand-green-500" /> 5-star rated
          </span>
        </div>

        {/* Progress */}
        {step < QUOTE_STEP && (
          <div className="mb-6">
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-purple-100">
              <motion.div
                className="h-full rounded-full bg-brand-green-500"
                initial={false}
                animate={{ width: `${((step + 1) / (QUOTE_STEP + 1)) * 100}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-400">Step {step + 1} of {QUOTE_STEP} · takes under a minute</p>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <StepShell
                  title="Get your fixed price in 60 seconds"
                  subtitle="No hidden fees, no obligation. Tell us where to send it."
                >
                  <Field icon={User} placeholder="Full name" value={fullName} onChange={setFullName} autoFocus />
                  <Field icon={Phone} placeholder="Mobile number" value={phone} onChange={setPhone} type="tel" />
                  <Field icon={Mail} placeholder="Email address" value={email} onChange={setEmail} type="email" />
                  <p className="mt-1 text-xs text-slate-400">We&apos;ll send your quote here. We never share your details.</p>
                </StepShell>
              )}

              {step === 1 && (
                <StepShell title="Where are you moving from?" subtitle="Just the postcode — that's all we need to price it.">
                  <PostcodeField icon={MapPin} placeholder="e.g. RG18 3EB" value={fromPostcode} onChange={setFromPostcode} autoFocus onEnter={next} />
                </StepShell>
              )}

              {step === 2 && (
                <StepShell title="And where are you moving to?" subtitle="Postcode only — no need for the full address.">
                  <PostcodeField icon={Home} placeholder="e.g. SL6 1AA" value={toPostcode} onChange={setToPostcode} autoFocus onEnter={next} />
                </StepShell>
              )}

              {step === 3 && (
                <StepShell title="How big is the move?" subtitle="Roughly how many bedrooms are we moving?">
                  <div className="grid grid-cols-3 gap-2.5">
                    {BEDROOMS.map((b) => (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => { setBedrooms(b.key); }}
                        className={`rounded-xl border-2 px-3 py-4 text-sm font-bold transition-all ${
                          bedrooms === b.key
                            ? "border-brand-purple-600 bg-brand-purple-50 text-brand-purple-900"
                            : "border-slate-200 text-slate-600 hover:border-brand-purple-300"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 4 && (
                <StepShell title="What are the big items?" subtitle="Add the main things — you can fine-tune everything after. Skip if you're not sure.">
                  <div className="space-y-2">
                    {KEY_ITEMS.map((it) => (
                      <ItemRow key={it.key} label={it.label} value={qty[it.key] ?? 0} onChange={(v) => setQty((p) => ({ ...p, [it.key]: v }))} />
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 5 && (
                <StepShell title="When do you want to move?" subtitle="Pick your ideal date — we'll confirm availability.">
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={moveDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setMoveDate(e.target.value)}
                      className="h-14 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-3 text-base outline-none transition-colors focus:border-brand-purple-600"
                    />
                  </div>
                </StepShell>
              )}

              {step === QUOTE_STEP && (
                <QuoteView
                  firstName={fullName.split(" ")[0] || "there"}
                  estimate={estimate}
                  estimating={estimating}
                  onEdit={() => goTo(3)}
                  onReserve={reserve}
                  submitting={submitting}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

          {/* Nav */}
          {step < QUOTE_STEP && (
            <div className="mt-6 flex items-center gap-3">
              {step > 0 && (
                <button type="button" onClick={back} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:border-slate-300">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
              <button
                type="button"
                onClick={next}
                disabled={!canProceed()}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green-600 text-base font-bold text-white shadow-lg shadow-brand-green-200 transition-colors hover:bg-brand-green-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {step === 5 ? "See my price" : "Continue"} <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Trust footer (not a nav footer — just reassurance) */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-brand-green-600" /> Fully insured crews</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-green-600" /> Fixed price, no hidden fees</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-green-600" /> Free to reserve</span>
        </div>
      </div>
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────── */

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-purple-950">{title}</h1>
      {subtitle && <p className="mt-1.5 mb-5 text-sm text-slate-500">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-5"}>{children}</div>
    </div>
  );
}

function Field({
  icon: Icon, placeholder, value, onChange, type = "text", autoFocus,
}: {
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string; value: string; onChange: (v: string) => void; type?: string; autoFocus?: boolean;
}) {
  return (
    <div className="relative mb-3">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        type={type}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-3 text-base outline-none transition-colors focus:border-brand-purple-600"
      />
    </div>
  );
}

function PostcodeField({
  icon: Icon, placeholder, value, onChange, autoFocus, onEnter,
}: {
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string; value: string; onChange: (v: string) => void; autoFocus?: boolean; onEnter?: () => void;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onKeyDown={(e) => { if (e.key === "Enter") onEnter?.(); }}
        placeholder={placeholder}
        autoCapitalize="characters"
        className="h-14 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-3 text-lg font-semibold uppercase tracking-wide outline-none transition-colors focus:border-brand-purple-600"
      />
    </div>
  );
}

function ItemRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-30 hover:border-brand-purple-300"
          aria-label={`Remove ${label}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-5 text-center text-sm font-bold tabular-nums text-slate-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-purple-300 bg-brand-purple-50 text-brand-purple-700 hover:bg-brand-purple-100"
          aria-label={`Add ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function QuoteView({
  firstName, estimate, estimating, onEdit, onReserve, submitting,
}: {
  firstName: string;
  estimate: Estimate | null;
  estimating: boolean;
  onEdit: () => void;
  onReserve: () => void;
  submitting: boolean;
}) {
  return (
    <div>
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green-100">
          <Sparkles className="h-6 w-6 text-brand-green-600" />
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-purple-950">
          {firstName}, here&apos;s your price
        </h1>
        <p className="mt-1 text-sm text-slate-500">Fixed price. No hidden fees. Free to reserve.</p>
      </div>

      {estimating && !estimate ? (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <Loader2 className="mb-3 h-6 w-6 animate-spin" /> Working out your best price…
        </div>
      ) : estimate ? (
        <>
          {/* Standard — "what you get" INSIDE the card */}
          <div className="rounded-2xl border-2 border-brand-purple-200 bg-white p-5 shadow-lg shadow-slate-200/60">
            <div className="mb-1 flex items-center gap-2">
              <Truck className="h-5 w-5 text-brand-purple-700" />
              <h2 className="font-display text-lg font-extrabold text-brand-purple-950">{TIER_COPY.standard.name}</h2>
            </div>
            <p className="mb-3 text-sm text-slate-500">{TIER_COPY.standard.tagline}</p>
            <ul className="mb-4 space-y-1.5">
              {STANDARD_INCLUDES.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-600" /><span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-end justify-between border-t border-dashed border-slate-200 pt-4">
              <span className="font-display text-base font-bold text-brand-purple-950">Total</span>
              <span className="font-display text-3xl font-extrabold tabular-nums text-brand-purple-900">{gbp0(estimate.standardTotal)}</span>
            </div>
          </div>

          {/* Premium — "everything in Standard, plus…" */}
          <div className="relative mt-4 overflow-hidden rounded-2xl border-2 border-brand-purple-600 bg-white p-5 shadow-lg shadow-brand-purple-200/50">
            <span className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-xl bg-brand-purple-800 px-3 py-1 text-xs font-bold text-white">
              <Star className="h-3.5 w-3.5" /> RECOMMENDED
            </span>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-purple-700" />
              <h2 className="font-display text-lg font-extrabold text-brand-purple-950">{TIER_COPY.premium.name}</h2>
            </div>
            <p className="mb-3 font-display text-2xl font-extrabold tabular-nums text-brand-purple-900">{gbp0(estimate.premiumTotal)}</p>
            <ul className="space-y-1.5">
              {PREMIUM_INCLUDES.map((f, i) => (
                <li key={i} className={`flex items-start gap-2 text-sm ${i === 0 ? "font-semibold text-slate-700" : "text-slate-600"}`}>
                  {i === 0 ? <span className="w-4" /> : <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-600" />}
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              onClick={onReserve}
              disabled={submitting}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-green-600 text-base font-bold text-white shadow-lg shadow-brand-green-200 transition-colors hover:bg-brand-green-500 disabled:opacity-50"
            >
              {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Securing your date…</> : <>Reserve my move <ArrowRight className="h-5 w-5" /></>}
            </button>
            <button
              type="button"
              onClick={onEdit}
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-purple-300 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" /> Go back &amp; change my details
            </button>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4" /> No card needed now · Free to reserve · Pay a deposit to lock your date
          </p>
        </>
      ) : (
        <div className="py-10 text-center text-sm text-slate-500">
          We couldn&apos;t work out your price just now.{" "}
          <button type="button" onClick={onEdit} className="font-semibold text-brand-purple-700 underline">Go back and try again</button>.
        </div>
      )}
    </div>
  );
}
