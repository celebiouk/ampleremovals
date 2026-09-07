"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, ArrowRight, ArrowLeft, Loader2, ShieldCheck, Star, Check, Search,
  Phone, Mail, User, MapPin, Home, CalendarDays, CalendarRange, Plus, Minus, Building2, Pencil,
} from "lucide-react";
import { INVENTORY_CATALOG, type InventoryCategory, type InventorySelection } from "@/lib/inventory-catalog";
import type { AddressOption } from "@/types";

/* ── Config ───────────────────────────────────────────────── */

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

interface Access { parking: boolean | null; stairs: boolean | null; flights: number }
const emptyAccess = (): Access => ({ parking: null, stairs: null, flights: 1 });
const fmtAddress = (a: AddressOption | null) => (a ? [a.line_1, a.line_2, a.city, a.postcode].filter(Boolean).join(", ") : "");

const REVIEW_STEP = 8;

/* ── Root wizard ──────────────────────────────────────────── */

export function LandingBooking() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Contact + the enquiry it creates
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [enquiry, setEnquiry] = useState<{ bookingId: string; quoteToken: string } | null>(null);

  // Addresses
  const [fromPostcode, setFromPostcode] = useState("");
  const [fromAddr, setFromAddr] = useState<AddressOption | null>(null);
  const [toPostcode, setToPostcode] = useState("");
  const [toAddr, setToAddr] = useState<AddressOption | null>(null);
  // Property + access
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

  const today = new Date().toISOString().split("T")[0];

  // Same catalogue the main wizard uses (admin-hidden items removed).
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
  const qtyOf = (key: string, variant?: string) => selections.find((s) => s.key === key && s.variant === variant)?.quantity ?? 0;
  const setQty = (key: string, label: string, variant: string | undefined, quantity: number) =>
    setSelections((prev) => {
      const rest = prev.filter((s) => !(s.key === key && s.variant === variant));
      return quantity > 0 ? [...rest, { key, label, variant, quantity }] : rest;
    });
  const addCustom = () => {
    const name = customText.trim();
    if (!name) return;
    setSelections((prev) => [...prev, { key: `custom:${Date.now()}`, label: name, quantity: 1 }]);
    setCustomText("");
  };
  const totalItems = selections.reduce((n, s) => n + (s.quantity || 0), 0);

  const accessDone = (a: Access) => a.parking !== null && a.stairs !== null && (!a.stairs || a.flights >= 1);
  const canProceed = (): boolean => {
    switch (step) {
      case 0: return fullName.trim().length >= 2 && EMAIL_RE.test(email.trim()) && PHONE_RE.test(phone.replace(/[\s()-]/g, ""));
      case 1: return POSTCODE_RE.test(fromPostcode.trim()) && Boolean(fromAddr?.line_1);
      case 2: return Boolean(propertyType && bedrooms) && accessDone(fromAccess);
      case 3: return POSTCODE_RE.test(toPostcode.trim()) && Boolean(toAddr?.line_1);
      case 4: return accessDone(toAccess);
      case 5: return true;
      case 6: return description.trim().length >= 10;
      case 7: return isFlexible ? Boolean(flexFrom && flexTo && flexTo >= flexFrom) : Boolean(moveDate);
      default: return true;
    }
  };

  // Save the enquiry the moment we have name/phone/email (abandonment capture).
  const startEnquiry = async () => {
    if (enquiry) return true;
    try {
      const res = await fetch("/api/booking/landing/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.bookingId && data.quoteToken) {
        setEnquiry({ bookingId: data.bookingId, quoteToken: data.quoteToken });
      }
    } catch { /* non-fatal — we can still create the booking at submit */ }
    return true;
  };

  const next = async () => {
    setError("");
    if (!canProceed()) return;
    if (step === 0) { setBusy(true); await startEnquiry(); setBusy(false); }
    setStep((s) => Math.min(s + 1, REVIEW_STEP));
  };
  const back = () => { setError(""); setStep((s) => Math.max(s - 1, 0)); };

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/booking/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: enquiry?.bookingId, token: enquiry?.quoteToken,
          fullName, email, phone,
          originPostcode: fromPostcode, destinationPostcode: toPostcode,
          originAddress: fromAddr ?? undefined, destinationAddress: toAddr ?? undefined,
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
      const data = await res.json();
      if (!res.ok || !data.success || !data.bookingId || !data.quoteToken) throw new Error(data.error || "Something went wrong. Please try again.");
      router.push(`/quote/${data.bookingId}/${data.quoteToken}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
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
        <div className="mb-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-purple-100">
            <motion.div className="h-full rounded-full bg-brand-green-500" initial={false}
              animate={{ width: `${((step + 1) / (REVIEW_STEP + 1)) * 100}%` }} transition={{ duration: 0.35 }} />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400">Step {step + 1} of {REVIEW_STEP + 1} · fixed price, no obligation</p>
        </div>

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
                <StepShell title="Where are you moving from?" subtitle="Enter your postcode, then pick your address.">
                  <AddressPicker postcode={fromPostcode} setPostcode={setFromPostcode} address={fromAddr} setAddress={setFromAddr} />
                </StepShell>
              )}

              {step === 2 && (
                <StepShell title="About the place you're leaving" subtitle="A few quick details so our crew arrive ready.">
                  <Label>Property type</Label>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {PROPERTY_TYPES.map((p) => (<ChoiceCard key={p.key} icon={p.icon} label={p.label} selected={propertyType === p.key} onClick={() => setPropertyType(p.key)} />))}
                  </div>
                  <Label>How many bedrooms?</Label>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {BEDROOMS.map((b) => (<PillButton key={b.key} label={b.label} selected={bedrooms === b.key} onClick={() => setBedrooms(b.key)} />))}
                  </div>
                  <AccessFields access={fromAccess} setAccess={setFromAccess} />
                </StepShell>
              )}

              {step === 3 && (
                <StepShell title="And where are you moving to?" subtitle="Enter the postcode, then pick the address.">
                  <AddressPicker postcode={toPostcode} setPostcode={setToPostcode} address={toAddr} setAddress={setToAddr} />
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
                              <div key={item.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                <span className="text-sm font-medium text-brand-purple-950">{item.label}</span>
                                <Stepper value={qtyOf(item.key)} onChange={(n) => setQty(item.key, item.label, undefined, n)} />
                              </div>
                            )
                          )}
                        </div>
                      </section>
                    ))}
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
                    placeholder="e.g. narrow staircase at the flat, need to finish before 1pm, a few fragile paintings…"
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

              {step === REVIEW_STEP && (
                <StepShell title="Quick review before your quote" subtitle="Check everything's right — tap any section to change it.">
                  <div className="space-y-2.5">
                    <ReviewRow label="Your details" value={`${fullName} · ${phone} · ${email}`} onEdit={() => setStep(0)} />
                    <ReviewRow label="Moving from" value={fmtAddress(fromAddr)} onEdit={() => setStep(1)} />
                    <ReviewRow label="From — property & access" value={`${propertyType || "—"}, ${bedrooms || "—"} bed · parking ${fromAccess.parking ? "yes" : "no"} · ${fromAccess.stairs ? `${fromAccess.flights} flight(s)` : "ground floor"}`} onEdit={() => setStep(2)} />
                    <ReviewRow label="Moving to" value={fmtAddress(toAddr)} onEdit={() => setStep(3)} />
                    <ReviewRow label="To — access" value={`parking ${toAccess.parking ? "yes" : "no"} · ${toAccess.stairs ? `${toAccess.flights} flight(s)` : "ground floor"}`} onEdit={() => setStep(4)} />
                    <ReviewRow label="Items" value={totalItems ? `${totalItems} item${totalItems === 1 ? "" : "s"}` : "None added"} onEdit={() => setStep(5)} />
                    <ReviewRow label="About your move" value={description || "—"} onEdit={() => setStep(6)} />
                    <ReviewRow label="Move date" value={isFlexible ? `Flexible: ${flexFrom} – ${flexTo}` : moveDate} onEdit={() => setStep(7)} />
                  </div>
                </StepShell>
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

          <div className="mt-6 flex items-center gap-3">
            {step > 0 && (
              <button type="button" onClick={back} disabled={busy} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:border-slate-300 disabled:opacity-50">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            {step < REVIEW_STEP ? (
              <button type="button" onClick={next} disabled={!canProceed() || busy}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green-600 text-base font-bold text-white shadow-lg shadow-brand-green-200 hover:bg-brand-green-500 disabled:cursor-not-allowed disabled:opacity-40">
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ArrowRight className="h-5 w-5" /></>}
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={busy}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green-600 text-base font-bold text-white shadow-lg shadow-brand-green-200 hover:bg-brand-green-500 disabled:opacity-50">
                {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Getting your quote…</> : <>See my quote <ArrowRight className="h-5 w-5" /></>}
              </button>
            )}
          </div>
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

/** Postcode → "Find address" → pick from the list, or enter it manually. */
function AddressPicker({ postcode, setPostcode, address, setAddress }: {
  postcode: string; setPostcode: (v: string) => void; address: AddressOption | null; setAddress: (a: AddressOption | null) => void;
}) {
  const [list, setList] = useState<AddressOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(false);

  const find = async () => {
    if (!POSTCODE_RE.test(postcode.trim())) return;
    setLoading(true); setList(null); setAddress(null); setManual(false);
    try {
      const res = await fetch(`/api/postcode/lookup?postcode=${encodeURIComponent(postcode.trim())}`);
      const data = await res.json();
      const found = (data.addresses ?? []).filter((a: AddressOption) => a.line_1);
      setList(found);
      if (!found.length) setManual(true);
    } catch { setManual(true); } finally { setLoading(false); }
  };

  const pc = postcode.trim().toUpperCase();
  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input value={postcode} onChange={(e) => { setPostcode(e.target.value.toUpperCase()); setList(null); setAddress(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); find(); } }} placeholder="e.g. RG18 3EB" autoCapitalize="characters"
            className="h-14 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-3 text-lg font-semibold uppercase tracking-wide outline-none focus:border-brand-purple-600" />
        </div>
        <button type="button" onClick={find} disabled={!POSTCODE_RE.test(postcode.trim()) || loading}
          className="flex h-14 items-center gap-1.5 rounded-xl bg-brand-purple-800 px-4 text-sm font-bold text-white hover:bg-brand-purple-900 disabled:opacity-40">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Find
        </button>
      </div>

      {/* Address list */}
      {list && list.length > 0 && !manual && (
        <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto">
          {list.map((a, i) => {
            const selected = address?.line_1 === a.line_1 && address?.city === a.city;
            return (
              <button key={i} type="button" onClick={() => setAddress({ ...a, postcode: pc })}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-colors ${
                  selected ? "border-brand-purple-600 bg-brand-purple-50 text-brand-purple-900" : "border-slate-200 text-slate-700 hover:border-brand-purple-300"}`}>
                <span>{[a.line_1, a.line_2, a.city].filter(Boolean).join(", ")}</span>
                {selected && <Check className="h-4 w-4 shrink-0 text-brand-purple-700" />}
              </button>
            );
          })}
        </div>
      )}

      {list && !manual && (
        <button type="button" onClick={() => { setManual(true); setAddress({ line_1: "", postcode: pc }); }} className="mt-3 text-sm font-semibold text-brand-purple-700 hover:underline">
          Can&apos;t see it? Enter address manually
        </button>
      )}

      {/* Manual entry */}
      {manual && (
        <div className="mt-3 space-y-2">
          <input value={address?.line_1 ?? ""} onChange={(e) => setAddress({ line_1: e.target.value, line_2: address?.line_2, city: address?.city, postcode: pc })}
            placeholder="Address line 1 (building & street)" className="h-12 w-full rounded-xl border-2 border-slate-200 px-3 text-base outline-none focus:border-brand-purple-600" />
          <input value={address?.line_2 ?? ""} onChange={(e) => setAddress({ line_1: address?.line_1 ?? "", line_2: e.target.value, city: address?.city, postcode: pc })}
            placeholder="Address line 2 (optional)" className="h-12 w-full rounded-xl border-2 border-slate-200 px-3 text-base outline-none focus:border-brand-purple-600" />
          <input value={address?.city ?? ""} onChange={(e) => setAddress({ line_1: address?.line_1 ?? "", line_2: address?.line_2, city: e.target.value, postcode: pc })}
            placeholder="Town / city" className="h-12 w-full rounded-xl border-2 border-slate-200 px-3 text-base outline-none focus:border-brand-purple-600" />
        </div>
      )}
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

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{value || "—"}</p>
      </div>
      <button type="button" onClick={onEdit} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-purple-700 hover:underline">
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
    </div>
  );
}
