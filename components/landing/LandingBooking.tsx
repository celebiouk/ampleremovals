"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, ArrowRight, ArrowLeft, Loader2, ShieldCheck, Star, Check, Sparkles,
  Phone, Mail, User, MapPin, Home, CalendarDays, CalendarRange, Plus, Minus, Building2,
} from "lucide-react";
import { STANDARD_INCLUDES, PREMIUM_INCLUDES, TIER_COPY } from "@/lib/tiers";
import { INVENTORY_CATALOG, type InventoryCategory, type InventorySelection } from "@/lib/inventory-catalog";

/* ── Config ───────────────────────────────────────────────── */

const gbp0 = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n || 0);

const BEDROOMS = [
  { key: "studio", label: "Studio" }, { key: "1", label: "1 bed" }, { key: "2", label: "2 bed" },
  { key: "3", label: "3 bed" }, { key: "4", label: "4 bed" }, { key: "5+", label: "5+ bed" },
];
const PROPERTY_TYPES = [
  { key: "house", label: "House", icon: Home },
  { key: "flat", label: "Flat", icon: Building2 },
  { key: "bungalow", label: "Bungalow", icon: Home },
];

const POSTCODE_RE = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(?:\+44|0)\d{9,10}$/;

interface Estimate { standardTotal: number; premiumTotal: number; deposit: number }
interface Access { parking: boolean | null; stairs: boolean | null; flights: number }
const emptyAccess = (): Access => ({ parking: null, stairs: null, flights: 1 });

const compositeKey = (key: string, variant?: string) => `${key}|${variant ?? ""}`;

/* ── Root wizard ──────────────────────────────────────────── */

export function LandingBooking() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Contact
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  // Addresses (postcode only) + per-address details
  const [fromPostcode, setFromPostcode] = useState("");
  const [toPostcode, setToPostcode] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [fromAccess, setFromAccess] = useState<Access>(emptyAccess());
  const [toAccess, setToAccess] = useState<Access>(emptyAccess());
  // Items
  const [catalog, setCatalog] = useState<InventoryCategory[]>(INVENTORY_CATALOG);
  const [selections, setSelections] = useState<InventorySelection[]>([]);
  const [customText, setCustomText] = useState("");
  // Description + date
  const [description, setDescription] = useState("");
  const [isFlexible, setIsFlexible] = useState(false);
  const [moveDate, setMoveDate] = useState("");
  const [flexFrom, setFlexFrom] = useState("");
  const [flexTo, setFlexTo] = useState("");
  // Quote
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimating, setEstimating] = useState(false);

  const QUOTE_STEP = 8;
  const today = new Date().toISOString().split("T")[0];

  // Load the same catalogue the main wizard uses (admin-hidden items removed).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d: { success?: boolean; items?: { key: string; label: string; category: string }[]; hiddenKeys?: string[] }) => {
        if (cancelled || !d.success) return;
        const hidden = new Set(d.hiddenKeys ?? []);
        const merged: InventoryCategory[] = INVENTORY_CATALOG
          .map((c) => ({ ...c, items: c.items.filter((i) => !hidden.has(i.key)) }))
          .filter((c) => c.items.length > 0);
        for (const it of d.items ?? []) {
          const cat = merged.find((c) => c.category === it.category);
          if (cat) cat.items.push({ key: it.key, label: it.label });
          else merged.push({ category: it.category, items: [{ key: it.key, label: it.label }] });
        }
        setCatalog(merged);
      })
      .catch(() => { /* base catalogue still works */ });
    return () => { cancelled = true; };
  }, []);

  // Item helpers
  const qtyOf = (key: string, variant?: string) =>
    selections.find((s) => s.key === key && s.variant === variant)?.quantity ?? 0;
  const setQty = (key: string, label: string, variant: string | undefined, quantity: number) => {
    setSelections((prev) => {
      const rest = prev.filter((s) => !(s.key === key && s.variant === variant));
      return quantity > 0 ? [...rest, { key, label, variant, quantity }] : rest;
    });
  };
  const addCustom = () => {
    const name = customText.trim();
    if (!name) return;
    setSelections((prev) => [...prev, { key: `custom:${Date.now()}`, label: name, quantity: 1 }]);
    setCustomText("");
  };
  const totalItems = selections.reduce((n, s) => n + (s.quantity || 0), 0);

  // Live estimate on the quote step (refreshes when they go back and edit).
  const estimateKey = `${bedrooms}|${fromPostcode}|${toPostcode}|${JSON.stringify(selections)}`;
  useEffect(() => {
    if (step !== QUOTE_STEP) return;
    let cancelled = false;
    setEstimating(true);
    (async () => {
      try {
        const res = await fetch("/api/quote/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bedrooms, inventory: selections, originPostcode: fromPostcode, destinationPostcode: toPostcode }),
        });
        const data = await res.json();
        if (!cancelled && data.success) setEstimate({ standardTotal: data.standardTotal, premiumTotal: data.premiumTotal, deposit: data.deposit });
      } catch { /* keep previous */ } finally { if (!cancelled) setEstimating(false); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, estimateKey]);

  const accessDone = (a: Access) => a.parking !== null && a.stairs !== null && (!a.stairs || a.flights >= 1);
  const canProceed = (): boolean => {
    switch (step) {
      case 0: return fullName.trim().length >= 2 && EMAIL_RE.test(email.trim()) && PHONE_RE.test(phone.replace(/[\s()-]/g, ""));
      case 1: return POSTCODE_RE.test(fromPostcode.trim());
      case 2: return Boolean(propertyType && bedrooms) && accessDone(fromAccess);
      case 3: return POSTCODE_RE.test(toPostcode.trim());
      case 4: return accessDone(toAccess);
      case 5: return true;
      case 6: return description.trim().length >= 10;
      case 7: return isFlexible ? Boolean(flexFrom && flexTo && flexTo >= flexFrom) : Boolean(moveDate);
      default: return true;
    }
  };

  const next = () => { setError(""); if (canProceed()) setStep((s) => Math.min(s + 1, QUOTE_STEP)); };
  const back = () => { setError(""); setStep((s) => Math.max(s - 1, 0)); };

  // Reserve on the chosen tier: create the booking, reserve that tier, then hand
  // off to the quote page's payment step (card / Klarna / bank).
  const reserve = async (tier: "standard" | "premium") => {
    setSubmitting(true);
    setError("");
    try {
      const createRes = await fetch("/api/booking/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, email, phone,
          originPostcode: fromPostcode, destinationPostcode: toPostcode,
          propertyType, bedrooms,
          floor: fromAccess.stairs ? String(fromAccess.flights) : "ground",
          parkingWithin20m: fromAccess.parking,
          destFloor: toAccess.stairs ? String(toAccess.flights) : "ground",
          destParkingWithin20m: toAccess.parking,
          description: description.trim(),
          inventory: selections,
          isFlexibleDate: isFlexible,
          moveDate: isFlexible ? undefined : moveDate,
          flexibleDateFrom: isFlexible ? flexFrom : undefined,
          flexibleDateTo: isFlexible ? flexTo : undefined,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok || !created.success || !created.bookingId || !created.quoteToken) {
        throw new Error(created.error || "Something went wrong. Please try again.");
      }
      const { bookingId, quoteToken } = created;
      // Reserve the chosen tier so the quote page opens straight on payment.
      await fetch("/api/quote/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, token: quoteToken, removedKeys: [], tier }),
      });
      router.push(`/quote/${bookingId}/${quoteToken}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-50 via-white to-brand-green-50 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        {/* Brand + trust */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple-800 text-white"><Truck className="h-5 w-5" /></span>
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
              <motion.div className="h-full rounded-full bg-brand-green-500" initial={false}
                animate={{ width: `${((step + 1) / QUOTE_STEP) * 100}%` }} transition={{ duration: 0.35 }} />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-400">Step {step + 1} of {QUOTE_STEP} · fixed price, no obligation</p>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-7">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
              {step === 0 && (
                <StepShell title="Get your fixed price in 60 seconds" subtitle="No hidden fees, no obligation. Where should we send it?">
                  <Field icon={User} placeholder="Full name" value={fullName} onChange={setFullName} autoFocus />
                  <Field icon={Phone} placeholder="Mobile number" value={phone} onChange={setPhone} type="tel" />
                  <Field icon={Mail} placeholder="Email address" value={email} onChange={setEmail} type="email" />
                  <p className="mt-1 text-xs text-slate-400">We&apos;ll send your quote here. We never share your details.</p>
                </StepShell>
              )}

              {step === 1 && (
                <StepShell title="Where are you moving from?" subtitle="Just the postcode — that's all we need to price it.">
                  <PostcodeField value={fromPostcode} onChange={setFromPostcode} placeholder="e.g. RG18 3EB" autoFocus onEnter={next} />
                </StepShell>
              )}

              {step === 2 && (
                <StepShell title="About the place you're leaving" subtitle="A few quick details so our crew arrive ready.">
                  <Label>Property type</Label>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {PROPERTY_TYPES.map((p) => (
                      <ChoiceCard key={p.key} icon={p.icon} label={p.label} selected={propertyType === p.key} onClick={() => setPropertyType(p.key)} />
                    ))}
                  </div>
                  <Label>How many bedrooms?</Label>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {BEDROOMS.map((b) => (
                      <PillButton key={b.key} label={b.label} selected={bedrooms === b.key} onClick={() => setBedrooms(b.key)} />
                    ))}
                  </div>
                  <AccessFields access={fromAccess} setAccess={setFromAccess} />
                </StepShell>
              )}

              {step === 3 && (
                <StepShell title="And where are you moving to?" subtitle="Postcode only — no need for the full address.">
                  <PostcodeField value={toPostcode} onChange={setToPostcode} placeholder="e.g. SL6 1AA" autoFocus onEnter={next} />
                </StepShell>
              )}

              {step === 4 && (
                <StepShell title="About the new place" subtitle="So we know what to expect at the other end.">
                  <AccessFields access={toAccess} setAccess={setToAccess} />
                </StepShell>
              )}

              {step === 5 && (
                <StepShell title="What are you moving?" subtitle="Tap ＋ on anything you're bringing. It's fine to guess.">
                  <div className="mb-4 flex items-center justify-between rounded-xl border border-brand-purple-100 bg-brand-purple-50/60 px-4 py-2.5">
                    <span className="text-sm font-medium text-brand-purple-900">{totalItems === 0 ? "Nothing added yet" : `${totalItems} item${totalItems === 1 ? "" : "s"} added`}</span>
                    {totalItems > 0 && <button type="button" onClick={() => setSelections([])} className="text-sm font-semibold text-brand-purple-700 hover:underline">Clear all</button>}
                  </div>
                  <div className="max-h-[46vh] space-y-5 overflow-y-auto pr-1">
                    {catalog.map((cat) => (
                      <section key={cat.category}>
                        <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-slate-400">{cat.category}</h3>
                        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                          {cat.items.map((item) =>
                            item.variants ? (
                              <div key={item.key} className="px-4 py-2.5">
                                <p className="mb-1.5 text-sm font-semibold text-brand-purple-950">{item.label}</p>
                                {item.variants.map((v) => (
                                  <div key={v.key} className="flex items-center justify-between gap-3 py-1">
                                    <span className="text-sm text-slate-600">{v.label}</span>
                                    <Stepper value={qtyOf(item.key, v.key)} onChange={(n) => setQty(item.key, `${item.label} — ${v.label}`, v.key, n)} />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div key={compositeKey(item.key)} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                <span className="text-sm font-medium text-brand-purple-950">{item.label}</span>
                                <Stepper value={qtyOf(item.key)} onChange={(n) => setQty(item.key, item.label, undefined, n)} />
                              </div>
                            )
                          )}
                        </div>
                      </section>
                    ))}
                    {/* Custom items */}
                    {selections.filter((s) => s.key.startsWith("custom:")).length > 0 && (
                      <section>
                        <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-slate-400">Your own items</h3>
                        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                          {selections.filter((s) => s.key.startsWith("custom:")).map((it) => (
                            <div key={it.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                              <span className="text-sm font-medium text-brand-purple-950">{it.label}</span>
                              <Stepper value={it.quantity} onChange={(n) => setQty(it.key, it.label, undefined, n)} />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                  <div className="mt-4 rounded-xl border-2 border-dashed border-slate-200 p-3">
                    <div className="flex gap-2">
                      <input value={customText} onChange={(e) => setCustomText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                        placeholder="Something else? e.g. Piano" className="h-11 min-w-0 flex-1 rounded-xl border-2 border-slate-200 px-3 text-base outline-none focus:border-brand-purple-600" />
                      <button type="button" onClick={addCustom} disabled={!customText.trim()} className="shrink-0 rounded-xl bg-brand-purple-800 px-4 text-sm font-bold text-white hover:bg-brand-purple-900 disabled:opacity-40">Add</button>
                    </div>
                  </div>
                </StepShell>
              )}

              {step === 6 && (
                <StepShell title="Anything else we should know?" subtitle="Tell us about your move — fragile items, tricky access, timings, anything at all.">
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5}
                    placeholder="e.g. 2 flights of stairs at the flat, need to be done before 1pm, a few fragile paintings…"
                    className="min-h-[120px] w-full resize-y rounded-xl border-2 border-slate-200 px-4 py-3 text-base leading-relaxed outline-none focus:border-brand-purple-600" />
                  <p className="mt-2 text-xs text-slate-400">{description.trim().length < 10 ? "A sentence or two helps us quote accurately." : "Great, thank you."}</p>
                </StepShell>
              )}

              {step === 7 && (
                <StepShell title="When would you like to move?" subtitle="Pick a specific date, or tell us your flexible window.">
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    <ChoiceCard icon={CalendarDays} label="Specific date" selected={!isFlexible} onClick={() => setIsFlexible(false)} />
                    <ChoiceCard icon={CalendarRange} label="I'm flexible" selected={isFlexible} onClick={() => setIsFlexible(true)} />
                  </div>
                  {!isFlexible ? (
                    <DateInput label="Preferred date" value={moveDate} min={today} onChange={setMoveDate} />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DateInput label="Earliest" value={flexFrom} min={today} onChange={setFlexFrom} />
                      <DateInput label="Latest" value={flexTo} min={flexFrom || today} onChange={setFlexTo} />
                    </div>
                  )}
                </StepShell>
              )}

              {step === QUOTE_STEP && (
                <QuoteView firstName={fullName.split(" ")[0] || "there"} estimate={estimate} estimating={estimating}
                  onEdit={() => setStep(2)} onReserve={reserve} submitting={submitting} />
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

          {step < QUOTE_STEP && (
            <div className="mt-6 flex items-center gap-3">
              {step > 0 && (
                <button type="button" onClick={back} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:border-slate-300">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
              <button type="button" onClick={next} disabled={!canProceed()}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green-600 text-base font-bold text-white shadow-lg shadow-brand-green-200 hover:bg-brand-green-500 disabled:cursor-not-allowed disabled:opacity-40">
                {step === 7 ? "See my price" : "Continue"} <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

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

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm font-semibold text-slate-700">{children}</p>;
}

function Field({ icon: Icon, placeholder, value, onChange, type = "text", autoFocus }: {
  icon: React.ComponentType<{ className?: string }>; placeholder: string; value: string; onChange: (v: string) => void; type?: string; autoFocus?: boolean;
}) {
  return (
    <div className="relative mb-3">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
      <input type={type} autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-14 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-3 text-base outline-none focus:border-brand-purple-600" />
    </div>
  );
}

function PostcodeField({ value, onChange, placeholder, autoFocus, onEnter }: {
  value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean; onEnter?: () => void;
}) {
  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
      <input autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value.toUpperCase())}
        onKeyDown={(e) => { if (e.key === "Enter") onEnter?.(); }} placeholder={placeholder} autoCapitalize="characters"
        className="h-14 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-3 text-lg font-semibold uppercase tracking-wide outline-none focus:border-brand-purple-600" />
    </div>
  );
}

function ChoiceCard({ icon: Icon, label, selected, onClick }: {
  icon: React.ComponentType<{ className?: string }>; label: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
        selected ? "border-brand-purple-600 bg-brand-purple-50 text-brand-purple-900" : "border-slate-200 text-slate-600 hover:border-brand-purple-300"}`}>
      <Icon className="h-5 w-5" /> {label}
    </button>
  );
}

function PillButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-xl border-2 px-3 py-3 text-sm font-bold transition-all ${
        selected ? "border-brand-purple-600 bg-brand-purple-50 text-brand-purple-900" : "border-slate-200 text-slate-600 hover:border-brand-purple-300"}`}>
      {label}
    </button>
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[{ label: "Yes", v: true }, { label: "No", v: false }].map((o) => (
        <button key={o.label} type="button" onClick={() => onChange(o.v)}
          className={`min-w-[68px] rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-all ${
            value === o.v ? "border-brand-purple-600 bg-brand-purple-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-purple-300"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AccessFields({ access, setAccess }: { access: Access; setAccess: (a: Access) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700">Parking within 20m of the door?</span>
        <YesNo value={access.parking} onChange={(v) => setAccess({ ...access, parking: v })} />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="text-sm font-semibold text-slate-700">Ground floor, or stairs involved?</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setAccess({ ...access, stairs: false })}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold ${access.stairs === false ? "border-brand-purple-600 bg-brand-purple-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-purple-300"}`}>Ground</button>
          <button type="button" onClick={() => setAccess({ ...access, stairs: true })}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold ${access.stairs === true ? "border-brand-purple-600 bg-brand-purple-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-purple-300"}`}>Stairs</button>
        </div>
      </div>
      {access.stairs === true && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm font-semibold text-slate-700">How many flights of stairs?</span>
          <Stepper value={access.flights} min={1} onChange={(n) => setAccess({ ...access, flights: Math.max(1, n) })} />
        </div>
      )}
    </div>
  );
}

function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  if (value <= min && min === 0) {
    return (
      <button type="button" onClick={() => onChange(1)} aria-label="Add"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-purple-300 bg-brand-purple-50 text-brand-purple-700 hover:bg-brand-purple-100">
        <Plus className="h-4 w-4" />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Remove"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-brand-purple-300 disabled:opacity-30">
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-5 text-center text-sm font-bold tabular-nums text-slate-900">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Add"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-purple-300 bg-brand-purple-50 text-brand-purple-700 hover:bg-brand-purple-100">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function DateInput({ label, value, min, onChange }: { label: string; value: string; min: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input type="date" value={value} min={min} onChange={(e) => onChange(e.target.value)}
          className="h-14 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-3 text-base outline-none focus:border-brand-purple-600" />
      </div>
    </div>
  );
}

function QuoteView({ firstName, estimate, estimating, onEdit, onReserve, submitting }: {
  firstName: string; estimate: Estimate | null; estimating: boolean; onEdit: () => void;
  onReserve: (tier: "standard" | "premium") => void; submitting: boolean;
}) {
  const premiumInstalment = useMemo(() => estimate ? Math.round((estimate.premiumTotal / 3) * 100) / 100 : 0, [estimate]);
  return (
    <div>
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green-100"><Sparkles className="h-6 w-6 text-brand-green-600" /></div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-purple-950">{firstName}, here&apos;s your price</h1>
        <p className="mt-1 text-sm text-slate-500">Fixed price. No hidden fees. Free to reserve.</p>
      </div>

      {estimating && !estimate ? (
        <div className="flex flex-col items-center py-12 text-slate-400"><Loader2 className="mb-3 h-6 w-6 animate-spin" /> Working out your best price…</div>
      ) : estimate ? (
        <>
          {/* Standard — "what you get" inside the card */}
          <div className="rounded-2xl border-2 border-brand-purple-200 bg-white p-5 shadow-lg shadow-slate-200/60">
            <div className="mb-1 flex items-center gap-2"><Truck className="h-5 w-5 text-brand-purple-700" />
              <h2 className="font-display text-lg font-extrabold text-brand-purple-950">{TIER_COPY.standard.name}</h2></div>
            <p className="mb-3 text-sm text-slate-500">{TIER_COPY.standard.tagline}</p>
            <ul className="mb-4 space-y-1.5">
              {STANDARD_INCLUDES.map((f, i) => (<li key={i} className="flex items-start gap-2 text-sm text-slate-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-600" /><span>{f}</span></li>))}
            </ul>
            <div className="flex items-end justify-between border-t border-dashed border-slate-200 pt-4">
              <span className="font-display text-base font-bold text-brand-purple-950">Total</span>
              <span className="font-display text-3xl font-extrabold tabular-nums text-brand-purple-900">{gbp0(estimate.standardTotal)}</span>
            </div>
            <button type="button" onClick={() => onReserve("standard")} disabled={submitting}
              className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-green-600 text-base font-bold text-white shadow-lg shadow-brand-green-200 hover:bg-brand-green-500 disabled:opacity-50">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>I&apos;m booking Standard — {gbp0(estimate.standardTotal)}</>}
            </button>
          </div>

          {/* Premium — everything in standard, plus… */}
          <div className="relative mt-4 overflow-hidden rounded-2xl border-2 border-brand-purple-600 bg-white p-5 shadow-lg shadow-brand-purple-200/50">
            <span className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-xl bg-brand-purple-800 px-3 py-1 text-xs font-bold text-white"><Star className="h-3.5 w-3.5" /> RECOMMENDED</span>
            <div className="mb-1 flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand-purple-700" />
              <h2 className="font-display text-lg font-extrabold text-brand-purple-950">{TIER_COPY.premium.name}</h2></div>
            <p className="mb-3 font-display text-2xl font-extrabold tabular-nums text-brand-purple-900">{gbp0(estimate.premiumTotal)}</p>
            <ul className="mb-4 space-y-1.5">
              {PREMIUM_INCLUDES.map((f, i) => (<li key={i} className={`flex items-start gap-2 text-sm ${i === 0 ? "font-semibold text-slate-700" : "text-slate-600"}`}>{i === 0 ? <span className="w-4" /> : <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-600" />}<span>{f}</span></li>))}
            </ul>
            <button type="button" onClick={() => onReserve("premium")} disabled={submitting}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-800 text-base font-bold text-white shadow-lg shadow-brand-purple-200 hover:bg-brand-purple-900 disabled:opacity-50">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>I&apos;m booking Premium — {gbp0(estimate.premiumTotal)}</>}
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">or 3× {gbp0(premiumInstalment)} with Klarna</p>
          </div>

          <button type="button" onClick={onEdit} disabled={submitting}
            className="mt-4 flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-purple-300 disabled:opacity-50">
            <ArrowLeft className="h-4 w-4" /> Go back &amp; change my details
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400"><ShieldCheck className="h-4 w-4" /> No card needed now · Free to reserve · Pay by card, Klarna or bank</p>
        </>
      ) : (
        <div className="py-10 text-center text-sm text-slate-500">We couldn&apos;t work out your price just now.{" "}
          <button type="button" onClick={onEdit} className="font-semibold text-brand-purple-700 underline">Go back and try again</button>.</div>
      )}
    </div>
  );
}
