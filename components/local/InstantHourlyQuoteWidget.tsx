"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Loader2, ArrowRight } from "lucide-react";

const MIN_HOURS = 2;

interface Props {
  service: "man_and_van" | "house_clearance";
  /** £/hr for the single rate (man_and_van) or the "1 man + van" tier (house_clearance). */
  standardRate: number;
  /** £/hr for the "2 men" tier — only for house_clearance. */
  premiumRate?: number;
  accent: "green" | "purple";
}

/**
 * Self-serve instant quote: pick hours (+ crew size for house clearance),
 * enter contact + address, get a real price immediately and go straight to
 * the existing Standard/Premium deposit-payment page — no admin in the loop,
 * since the price is just hours × a fixed rate. See
 * app/api/quote/instant-hourly/route.ts.
 */
export function InstantHourlyQuoteWidget({ service, standardRate, premiumRate, accent }: Props) {
  const router = useRouter();
  const [hours, setHours] = useState(MIN_HOURS);
  const [crew, setCrew] = useState<"standard" | "premium">("standard");
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

  const rate = premiumRate != null && crew === "premium" ? premiumRate : standardRate;
  const total = hours * rate;

  const accentClasses = useMemo(() => accent === "green"
    ? { bg: "bg-brand-green-600", bgHover: "hover:bg-brand-green-700", border: "border-brand-green-600" }
    : { bg: "bg-brand-purple-800", bgHover: "hover:bg-brand-purple-900", border: "border-brand-purple-800" },
  [accent]);

  async function submit() {
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

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
      <p className="font-display text-xl font-bold text-slate-900">Get your instant price</p>

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
          <button type="button" onClick={() => setHours((h) => Math.max(MIN_HOURS, h - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center font-bold text-slate-900">{hours}</span>
          <button type="button" onClick={() => setHours((h) => h + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-400">{MIN_HOURS}-hour minimum booking.</p>

      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
        <p className="text-3xl font-extrabold text-slate-900">£{total.toFixed(2)}</p>
        <p className="text-xs text-slate-500">£{rate}/hr × {hours} hours — only {hours} hours charged, nothing hidden</p>
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white ${accentClasses.bg} ${accentClasses.bgHover}`}
        >
          Book this price <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <div className="mt-4 space-y-2.5">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          <div className="grid grid-cols-2 gap-2.5">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          </div>
          <input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Address line 1" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          <div className="grid grid-cols-2 gap-2.5">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Town (optional)" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Postcode" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          </div>
          <input value={moveDate} onChange={(e) => setMoveDate(e.target.value)} type="date" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white disabled:opacity-50 ${accentClasses.bg} ${accentClasses.bgHover}`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Confirm £{total.toFixed(2)} — pay a deposit to secure
          </button>
          <p className="text-center text-xs text-slate-400">You&apos;ll see the exact deposit amount on the next page before paying anything.</p>
        </div>
      )}
    </div>
  );
}
