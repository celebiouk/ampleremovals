"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Upload } from "lucide-react";
import { LICENCE_CATEGORIES, PREFERRED_WORK_TYPE_OPTIONS, PREFERRED_PATTERN_OPTIONS, LOGISTICS } from "@/lib/logistics";

const MAX_CV_SIZE = 5 * 1024 * 1024;

export function DriverApplicationForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [cvName, setCvName] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);

    if (!fd.get("privacyAccepted")) {
      setError("Please confirm you have read the Privacy Notice.");
      return;
    }
    const cv = fd.get("cv");
    if (cv instanceof File && cv.size > MAX_CV_SIZE) {
      setError("CV file must be under 5MB.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/logistics/driver-applications", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Something went wrong");
      setReference(data.reference);
      form.reset();
      setCvName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't submit your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <div className="rounded-2xl border-2 p-8 text-center" style={{ borderColor: LOGISTICS.colors.blue }}>
        <CheckCircle2 className="mx-auto h-10 w-10" style={{ color: LOGISTICS.colors.blue }} />
        <h3 className="mt-4 font-display text-xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Thanks for registering</h3>
        <p className="mt-2 text-sm text-slate-600">
          Your interest has been registered (ref <strong>{reference}</strong>). Registering doesn&apos;t guarantee an
          assignment — our team will be in touch if a suitable opportunity comes up.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full Name" name="fullName" required />
        <Field label="Email Address" name="email" type="email" required />
        <Field label="Telephone Number" name="phone" type="tel" required />
        <Field label="Town or City" name="townCity" required />
        <Field label="Postcode" name="postcode" required />
        <SelectField label="HGV Licence Category" name="licenceCategory" required options={LICENCE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
        <Field label="Years of HGV Driving Experience" name="experienceYears" placeholder="e.g. 5 years" />
        <Field label="Driver CPC Status" name="driverCpcStatus" placeholder="e.g. Valid, expires 06/2027" />
        <Field label="Digital Tachograph Card Status" name="tachoCardStatus" placeholder="e.g. Valid" />
        <SelectField label="Preferred Work Type" name="preferredWorkType" options={PREFERRED_WORK_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
        <SelectField label="Preferred Working Pattern" name="preferredPattern" options={PREFERRED_PATTERN_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
        <Field label="Availability" name="availability" placeholder="e.g. Immediately, from 1 Dec" />
        <Field label="Preferred Work Locations" name="preferredLocations" placeholder="e.g. Reading, Newbury" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700">Relevant Driving Experience</label>
        <textarea name="experienceNotes" rows={3} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700">Additional Information</label>
        <textarea name="additionalInfo" rows={3} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700">CV (optional — PDF or Word, max 5MB)</label>
        <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 hover:border-blue-400">
          <Upload className="h-4 w-4" />
          {cvName ?? "Click to choose a file"}
          <input type="file" name="cv" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setCvName(e.target.files?.[0]?.name ?? null)} />
        </label>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-slate-600">
        <input type="checkbox" name="privacyAccepted" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
        I confirm I have read the <a href="/privacy-notice" className="underline" style={{ color: LOGISTICS.colors.blue }}>Privacy Notice</a>.
      </label>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold text-white transition-colors disabled:opacity-60"
        style={{ backgroundColor: LOGISTICS.colors.blue }}
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Register My Interest
      </button>
    </form>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</label>
      <input id={name} name={name} type={type} required={required} placeholder={placeholder} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  );
}

function SelectField({ label, name, required, options }: { label: string; name: string; required?: boolean; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</label>
      <select id={name} name={name} required={required} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
        <option value="">Select…</option>
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  );
}
