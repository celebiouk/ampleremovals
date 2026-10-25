"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Zap, ShieldCheck, Lock } from "lucide-react";

const BEDROOM_OPTIONS = [
  { value: "studio", label: "Studio" },
  { value: "1", label: "1 bed" },
  { value: "2", label: "2 bed" },
  { value: "3", label: "3 bed" },
  { value: "4", label: "4 bed" },
  { value: "5+", label: "5+ bed" },
];

/**
 * Self-serve instant quote for House Removals location pages: pick home
 * size, see Standard/Premium instantly (same bedroom-band pricing admin
 * uses), enter contact + address, go straight to the existing Standard/
 * Premium deposit-payment page. See app/api/quote/instant-removals/route.ts.
 */
export function InstantRemovalsQuoteWidget() {
  const router = useRouter();
  const [bedrooms, setBedrooms] = useState("2");
  const [tier, setTier] = useState<"standard" | "premium">("standard");
  const [preview, setPreview] = useState<{ standard: number; premium: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
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

  async function loadPreview(newBedrooms: string) {
    setBedrooms(newBedrooms);
    setLoadingPreview(true);
    try {
      const res = await fetch("/api/quote/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bedrooms: newBedrooms }),
      });
      const data = await res.json();
      if (data.success) setPreview({ standard: data.standardTotal, premium: data.premiumTotal });
    } catch {
      // Preview is best-effort — the real total still gets confirmed server-side on submit.
    } finally {
      setLoadingPreview(false);
    }
  }

  async function submit() {
    setError("");
    if (!fullName.trim() || !email.trim() || !phone.trim()) { setError("Name, email and phone are required."); return; }
    if (!postcode.trim()) { setError("A postcode is required."); return; }
    if (!moveDate) { setError("Pick a date."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/quote/instant-removals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bedrooms, fullName, email, phone, moveDate,
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
      <p className="font-display text-xl font-bold text-slate-900">Your moving price, right now — no site visit needed</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-brand-purple-700" /> Instant, no callback</span>
        <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-brand-purple-700" /> Fully insured crew</span>
        <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-brand-purple-700" /> Small deposit secures it</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {BEDROOM_OPTIONS.map((b) => (
          <button
            key={b.value}
            type="button"
            onClick={() => loadPreview(b.value)}
            className={`rounded-xl border-2 p-2 text-center text-sm font-semibold ${bedrooms === b.value ? "border-brand-purple-800 bg-slate-50 text-slate-900" : "border-slate-200 text-slate-600"}`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {preview && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setTier("standard")} className={`rounded-xl border-2 p-3 text-left ${tier === "standard" ? "border-brand-purple-800 bg-slate-50" : "border-slate-200"}`}>
            <p className="text-sm font-semibold text-slate-900">Standard</p>
            <p className="text-xs text-slate-500">£{preview.standard.toFixed(0)}</p>
          </button>
          <button type="button" onClick={() => setTier("premium")} className={`rounded-xl border-2 p-3 text-left ${tier === "premium" ? "border-brand-purple-800 bg-slate-50" : "border-slate-200"}`}>
            <p className="text-sm font-semibold text-slate-900">Premium</p>
            <p className="text-xs text-slate-500">£{preview.premium.toFixed(0)}</p>
          </button>
        </div>
      )}

      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
        {loadingPreview || !preview ? (
          <p className="text-sm text-slate-500">{loadingPreview ? "Updating price…" : "Pick your home size above"}</p>
        ) : (
          <>
            <p className="text-3xl font-extrabold text-slate-900">£{(tier === "premium" ? preview.premium : preview.standard).toFixed(2)}</p>
            <p className="text-xs text-slate-500">{tier === "premium" ? "Full pack & move, all in" : "Loading, transport & offload"} — confirmed exactly on the next page</p>
          </>
        )}
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={!preview}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-800 px-6 py-3 font-semibold text-white hover:bg-brand-purple-900 disabled:opacity-50"
        >
          Lock in this price <ArrowRight className="h-4 w-4" />
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-800 px-6 py-3 font-semibold text-white hover:bg-brand-purple-900 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Confirm £{(tier === "premium" ? preview?.premium ?? 0 : preview?.standard ?? 0).toFixed(2)} — pay a deposit to secure
          </button>
          <p className="text-center text-xs text-slate-400">You&apos;ll see the exact deposit amount on the next page before paying anything.</p>
        </div>
      )}
    </div>
  );
}
