"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { LICENCE_CATEGORIES, URGENCY_OPTIONS, SHIFT_TYPE_OPTIONS, LOGISTICS } from "@/lib/logistics";

export function BusinessRequestForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState<string | null>(null);

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
      const res = await fetch("/api/logistics/driver-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: fd.get("companyName"),
          contactPerson: fd.get("contactPerson"),
          businessEmail: fd.get("businessEmail"),
          phone: fd.get("phone"),
          locationPostcode: fd.get("locationPostcode"),
          businessType: fd.get("businessType"),
          licenceCategory: fd.get("licenceCategory"),
          driversRequired: fd.get("driversRequired"),
          startDate: fd.get("startDate"),
          assignmentDuration: fd.get("assignmentDuration"),
          shiftType: fd.get("shiftType"),
          workingHours: fd.get("workingHours"),
          vehicleType: fd.get("vehicleType"),
          jobLocation: fd.get("jobLocation"),
          urgency: fd.get("urgency"),
          additionalInfo: fd.get("additionalInfo"),
          privacyAccepted: true,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Something went wrong");
      setReference(data.reference);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't submit your request. Please call us instead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <div className="rounded-2xl border-2 p-8 text-center" style={{ borderColor: LOGISTICS.colors.blue }}>
        <CheckCircle2 className="mx-auto h-10 w-10" style={{ color: LOGISTICS.colors.blue }} />
        <h3 className="mt-4 font-display text-xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Request received</h3>
        <p className="mt-2 text-sm text-slate-600">
          Thank you — your driver request has been received (ref <strong>{reference}</strong>). Our team will review the
          details and be in touch to confirm availability.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company Name" name="companyName" required />
        <Field label="Contact Person" name="contactPerson" required />
        <Field label="Business Email" name="businessEmail" type="email" required />
        <Field label="Telephone Number" name="phone" type="tel" required />
        <Field label="Company Location or Postcode" name="locationPostcode" required />
        <Field label="Type of Business" name="businessType" placeholder="e.g. Haulage, Distribution, Retail" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="HGV Licence Category Required" name="licenceCategory" required options={LICENCE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
        <Field label="Number of Drivers Required" name="driversRequired" type="number" min={1} max={50} defaultValue={1} required />
        <Field label="Assignment Start Date" name="startDate" type="date" />
        <Field label="Assignment Duration" name="assignmentDuration" placeholder="e.g. 2 weeks, ongoing" />
        <SelectField label="Shift Type" name="shiftType" options={SHIFT_TYPE_OPTIONS.map((s) => ({ value: s, label: s }))} />
        <Field label="Working Hours" name="workingHours" placeholder="e.g. 06:00–18:00" />
        <Field label="Vehicle Type" name="vehicleType" placeholder="e.g. Articulated, Rigid, Box Van" />
        <Field label="Job Location" name="jobLocation" required />
      </div>

      <SelectField
        label="Urgency of Requirement"
        name="urgency"
        required
        defaultValue="within_7_days"
        options={URGENCY_OPTIONS.map((u) => ({ value: u.value, label: u.label }))}
      />

      <div>
        <label className="block text-sm font-semibold text-slate-700">Additional Information</label>
        <textarea name="additionalInfo" rows={4} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
        Submit Driver Request
      </button>
    </form>
  );
}

function Field({ label, name, type = "text", required, placeholder, min, max, defaultValue }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string; min?: number; max?: number; defaultValue?: string | number }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

function SelectField({ label, name, required, defaultValue, options }: { label: string; name: string; required?: boolean; defaultValue?: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</label>
      <select id={name} name={name} required={required} defaultValue={defaultValue} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
        <option value="">Select…</option>
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  );
}
