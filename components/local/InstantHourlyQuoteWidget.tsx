"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Loader2, ArrowRight, Zap, ShieldCheck, Lock, Mail } from "lucide-react";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";

interface Props {
  service: "man_and_van" | "house_clearance";
  /** £/hr for the single rate (man_and_van) or the "1 man + van" tier (house_clearance). */
  standardRate: number;
  /** £/hr for the "2 men" tier — only for house_clearance. */
  premiumRate?: number;
  accent: "green" | "purple";
  /** Smallest number of hours the customer can pick. Man and Van stays at the
   *  usual 2-hour minimum; House Clearance / Rubbish Removal allow 1 — plenty
   *  of clearance jobs genuinely are that quick. */
  minHours?: number;
  /** House Clearance / Rubbish Removal only: offer a second "fixed price"
   *  path alongside the hourly one, for jobs better quoted from photos than
   *  an hourly guess. */
  allowFixedPrice?: boolean;
}

/**
 * Self-serve instant quote: pick hours (+ crew size for house clearance),
 * enter contact + address, get a real price immediately and go straight to
 * the existing Standard/Premium deposit-payment page — no admin in the loop,
 * since the price is just hours × a fixed rate. See
 * app/api/quote/instant-hourly/route.ts.
 *
 * When `allowFixedPrice` is set, a second tab lets the customer skip the
 * hourly estimate entirely: they describe what needs clearing, submit their
 * details (no price shown — a fair fixed price needs to see photos), and are
 * then prompted to send photos via WhatsApp or email. See
 * app/api/quote/fixed-price-request/route.ts.
 */
export function InstantHourlyQuoteWidget({ service, standardRate, premiumRate, accent, minHours = 2, allowFixedPrice = false }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"hourly" | "fixed">("hourly");

  // Hourly mode state
  const [hours, setHours] = useState(minHours);
  const [crew, setCrew] = useState<"standard" | "premium">("standard");

  // Shared contact/address/date state (both modes)
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fixed-price mode state
  const [itemsDescription, setItemsDescription] = useState("");
  const [fixedPriceSent, setFixedPriceSent] = useState<{ reference: string } | null>(null);

  const rate = premiumRate != null && crew === "premium" ? premiumRate : standardRate;
  const total = hours * rate;

  const accentClasses = useMemo(() => accent === "green"
    ? { bg: "bg-brand-green-600", bgHover: "hover:bg-brand-green-700", border: "border-brand-green-600" }
    : { bg: "bg-brand-purple-800", bgHover: "hover:bg-brand-purple-900", border: "border-brand-purple-800" },
  [accent]);

  async function submitHourly() {
    setError("");
    if (!fullName.trim() || !email.trim() || !phone.trim()) { setError("Name, email and phone are required."); return; }
    if (!postcode.trim()) { setError("A postcode is required."); return; }
    if (!moveDate) { setError("Pick a date."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/quote/instant-hourly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service, hours, fullName, email, phone, moveDate,
          address: { line_1: line1, city: city || undefined, postcode },
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Couldn't create your quote"); setSubmitting(false); return; }
      router.push(`/quote/${data.bookingId}/${data.token}`);
    } catch {
      setError("Couldn't create your quote — please try again.");
      setSubmitting(false);
    }
  }

  async function submitFixedPrice() {
    setError("");
    if (!itemsDescription.trim() || itemsDescription.trim().length < 5) { setError("Tell us a bit about what needs clearing."); return; }
    if (!fullName.trim() || !email.trim() || !phone.trim()) { setError("Name, email and phone are required."); return; }
    if (!postcode.trim()) { setError("A postcode is required."); return; }
    if (!moveDate) { setError("Pick a date."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/quote/fixed-price-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "house_clearance", itemsDescription, fullName, email, phone, moveDate,
          address: { line_1: line1, city: city || undefined, postcode },
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Couldn't send your request"); setSubmitting(false); return; }
      setFixedPriceSent({ reference: data.reference });
    } catch {
      setError("Couldn't send your request — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Fixed-price "request sent, now send photos" screen.
  if (fixedPriceSent) {
    const photoMessage = `Hi, here are photos for my clearance quote (ref ${fixedPriceSent.reference}).`;
    return (
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
        <p className="font-display text-xl font-bold text-slate-900">Almost there — send us a few photos</p>
        <p className="mt-2 text-sm text-slate-600">
          Thanks! We&apos;ve got your request (ref {fixedPriceSent.reference}). To send you a fair fixed price, we just need a few photos of what needs clearing.
        </p>
        <div className="mt-4 flex flex-col gap-2.5">
          <WhatsAppButton message={photoMessage} className="w-full justify-center" />
          <a
            href={`mailto:hello@ampleremovals.com?subject=${encodeURIComponent(`Photos for quote ${fixedPriceSent.reference}`)}&body=${encodeURIComponent("Photos attached for my clearance quote.")}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Mail className="h-4 w-4" /> Email us the photos
          </a>
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">We&apos;ll reply with your fixed price once we&apos;ve seen them.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
      <p className="font-display text-xl font-bold text-slate-900">
        {mode === "hourly" ? "Your price, right now — no calls, no waiting" : "Get a fixed price from photos"}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-brand-green-600" /> {mode === "hourly" ? "Instant, no callback" : "No guessing, no overpaying"}</span>
        <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-brand-green-600" /> Fully insured crew</span>
        <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-brand-green-600" /> Small deposit secures it</span>
      </div>

      {allowFixedPrice && (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => { setMode("hourly"); setError(""); }}
            className={`rounded-lg py-2 text-sm font-bold transition-colors ${mode === "hourly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Hourly price
          </button>
          <button
            type="button"
            onClick={() => { setMode("fixed"); setError(""); }}
            className={`rounded-lg py-2 text-sm font-bold transition-colors ${mode === "fixed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Fixed price
          </button>
        </div>
      )}

      {mode === "hourly" ? (
        <>
          {premiumRate != null && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCrew("standard")}
                className={`rounded-xl border-2 p-3 text-left ${crew === "standard" ? `${accentClasses.border} bg-slate-50` : "border-slate-200"}`}
              >
                <p className="text-sm font-semibold text-slate-900">1 man + van</p>
                <p className="text-xs text-slate-500">£{standardRate}/hr</p>
              </button>
              <button
                type="button"
                onClick={() => setCrew("premium")}
                className={`rounded-xl border-2 p-3 text-left ${crew === "premium" ? `${accentClasses.border} bg-slate-50` : "border-slate-200"}`}
              >
                <p className="text-sm font-semibold text-slate-900">2 men</p>
                <p className="text-xs text-slate-500">£{premiumRate}/hr</p>
              </button>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <span className="text-sm font-semibold text-slate-700">Hours needed</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setHours((h) => Math.max(minHours, h - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center font-bold text-slate-900">{hours}</span>
              <button type="button" onClick={() => setHours((h) => h + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-400">{minHours}-hour minimum booking.</p>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-3xl font-extrabold text-slate-900">£{total.toFixed(2)}</p>
            <p className="text-xs text-slate-500">£{rate}/hr × {hours} hour{hours === 1 ? "" : "s"} — only {hours} hour{hours === 1 ? "" : "s"} charged, nothing hidden</p>
          </div>

          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white ${accentClasses.bg} ${accentClasses.bgHover}`}
            >
              Lock in this price <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="mt-4 space-y-2.5">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
              <div className="grid grid-cols-2 gap-2.5">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
              </div>
              <input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Address line 1" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
              <div className="grid grid-cols-2 gap-2.5">
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Town (optional)" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
                <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Postcode" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
              </div>
              <input value={moveDate} onChange={(e) => setMoveDate(e.target.value)} type="date" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
              <button
                type="button"
                onClick={submitHourly}
                disabled={submitting}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white disabled:opacity-50 ${accentClasses.bg} ${accentClasses.bgHover}`}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Confirm £{total.toFixed(2)} — pay a deposit to secure
              </button>
              <p className="text-center text-xs text-slate-400">You&apos;ll see the exact deposit amount on the next page before paying anything.</p>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 space-y-2.5">
          <p className="text-sm text-slate-600">
            Prefer a fixed price instead of an hourly estimate? Tell us what needs clearing, send us your details, then a couple of photos — we&apos;ll quote you a fixed price, no guessing.
          </p>
          <textarea
            value={itemsDescription}
            onChange={(e) => setItemsDescription(e.target.value)}
            placeholder="What needs clearing? e.g. garage full of old furniture and boxes"
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
          />
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
          <div className="grid grid-cols-2 gap-2.5">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
          </div>
          <input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Address line 1" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
          <div className="grid grid-cols-2 gap-2.5">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Town (optional)" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
            <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Postcode" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
          </div>
          <input value={moveDate} onChange={(e) => setMoveDate(e.target.value)} type="date" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button
            type="button"
            onClick={submitFixedPrice}
            disabled={submitting}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white disabled:opacity-50 ${accentClasses.bg} ${accentClasses.bgHover}`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Request my fixed price <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-xs text-slate-400">Next step: send a couple of photos via WhatsApp or email.</p>
        </div>
      )}
    </div>
  );
}
