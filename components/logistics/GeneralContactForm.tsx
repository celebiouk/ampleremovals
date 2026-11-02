"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { LOGISTICS } from "@/lib/logistics";

const ENQUIRY_TYPES = [
  { value: "business_staffing", label: "Business Staffing Enquiry" },
  { value: "driver_registration", label: "Driver Registration" },
  { value: "existing_assignment", label: "Existing Assignment" },
  { value: "general", label: "General Enquiry" },
];

export function GeneralContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!fd.get("privacyAccepted")) {
      setError("Please confirm you have read the Privacy Notice.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/logistics/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fd.get("fullName"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          enquiryType: fd.get("enquiryType"),
          subject: fd.get("subject"),
          message: fd.get("message"),
          privacyAccepted: true,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Something went wrong");
      setSent(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send your message. Please call us instead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="border-2 p-8 text-center" style={{ borderColor: LOGISTICS.colors.blue }}>
        <CheckCircle2 className="mx-auto h-10 w-10" style={{ color: LOGISTICS.colors.blue }} />
        <h3 className="mt-4 font-display uppercase tracking-wide text-xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Message sent</h3>
        <p className="mt-2 text-sm text-slate-600">Thanks for getting in touch — we&apos;ll reply as soon as we can.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Full Name <span className="text-red-500">*</span></label>
          <input name="fullName" required className="mt-1.5 w-full border border-slate-300 px-3 py-2.5 text-sm logistics-input focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Email Address <span className="text-red-500">*</span></label>
          <input name="email" type="email" required className="mt-1.5 w-full border border-slate-300 px-3 py-2.5 text-sm logistics-input focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Telephone Number</label>
          <input name="phone" type="tel" className="mt-1.5 w-full border border-slate-300 px-3 py-2.5 text-sm logistics-input focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Enquiry Type <span className="text-red-500">*</span></label>
          <select name="enquiryType" required defaultValue="general" className="mt-1.5 w-full border border-slate-300 bg-white px-3 py-2.5 text-sm logistics-input focus:outline-none">
            {ENQUIRY_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700">Subject <span className="text-red-500">*</span></label>
        <input name="subject" required className="mt-1.5 w-full border border-slate-300 px-3 py-2.5 text-sm logistics-input focus:outline-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700">Message <span className="text-red-500">*</span></label>
        <textarea name="message" required rows={5} className="mt-1.5 w-full border border-slate-300 px-3 py-2.5 text-sm logistics-input focus:outline-none" />
      </div>
      <label className="flex items-start gap-2.5 text-sm text-slate-600">
        <input type="checkbox" name="privacyAccepted" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
        I confirm I have read the <a href="/privacy-notice" className="underline" style={{ color: LOGISTICS.colors.blue }}>Privacy Notice</a>.
      </label>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-white transition-colors disabled:opacity-60" style={{ backgroundColor: LOGISTICS.colors.blue }}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Send Message
      </button>
    </form>
  );
}
