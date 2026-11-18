"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { DELIVERY_LEAD_CATEGORY_LABELS } from "@/lib/delivery-leads";

export function DeliveryEnquiryForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const body = {
      businessName: form.get("businessName"),
      contactName: form.get("contactName"),
      email: form.get("email"),
      phone: form.get("phone"),
      category: form.get("category"),
      message: form.get("message"),
    };
    try {
      const res = await fetch("/api/delivery-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Something went wrong");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-green-200 bg-brand-green-50 p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-brand-green-600" />
        <h3 className="font-display text-xl font-bold text-brand-purple-950">Thanks — that&apos;s with us</h3>
        <p className="text-sm text-slate-600">We&apos;ll come back to you shortly to talk through what you need.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Business name
          <input name="businessName" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Your name
          <input name="contactName" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Email
          <input type="email" name="email" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Phone
          <input type="tel" name="phone" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" />
        </label>
      </div>
      <label className="text-sm font-semibold text-slate-700">
        What kind of business are you?
        <select name="category" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal">
          {Object.entries(DELIVERY_LEAD_CATEGORY_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-slate-700">
        What do you need delivered or collected?
        <textarea name="message" required rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" />
      </label>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 rounded-xl bg-brand-purple-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-purple-800 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Get in touch
      </button>
    </form>
  );
}
