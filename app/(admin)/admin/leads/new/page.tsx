"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Loader2, CheckCircle2, Copy, Mail, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeadResult {
  reference: string;
  link: string;
}

/**
 * Admin "New Lead" — capture just name/email/phone, and the customer gets an
 * instant email + SMS + WhatsApp invite with a link to finish the quote
 * themselves. Minimal manual work: enter three fields, click, done.
 */
export default function NewLeadPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LeadResult | null>(null);

  const canSubmit = fullName.trim() && email.trim() && phone.trim() && !submitting;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't create the lead.");
      setResult({ reference: data.reference, link: data.link });
      toast.success("Lead created — invite sent by email, SMS & WhatsApp.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setFullName(""); setEmail(""); setPhone(""); setResult(null);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple-800 text-white">
          <UserPlus className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-purple-950">New Lead</h1>
          <p className="text-sm text-slate-500">Enter the basics — we&apos;ll invite them to complete the rest.</p>
        </div>
      </div>

      {result ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-brand-green-600" />
            <div>
              <p className="font-display text-lg font-bold text-brand-purple-950">Invite sent!</p>
              <p className="text-sm text-slate-500">Reference {result.reference}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1"><Mail className="h-4 w-4" /> Email</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1"><MessageSquare className="h-4 w-4" /> SMS</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1"><Phone className="h-4 w-4" /> WhatsApp</span>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Completion link</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={result.link}
                className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => { navigator.clipboard?.writeText(result.link); toast.success("Link copied"); }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button onClick={reset} className="mt-6 w-full bg-brand-purple-800 hover:bg-brand-purple-900">
            Add another lead
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Jane Smith" autoFocus />
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="jane@example.com" />
          <Field label="Phone" type="tel" value={phone} onChange={setPhone} placeholder="07123 456789" />

          <Button
            type="submit"
            disabled={!canSubmit}
            className="mt-2 h-12 w-full bg-brand-green-600 text-base font-bold hover:bg-brand-green-500 disabled:opacity-50"
          >
            {submitting ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating…</>) : "Complete & send invite"}
          </Button>
          <p className="mt-3 text-center text-xs text-slate-400">
            They&apos;ll get an email, SMS and WhatsApp with a link to finish their quote.
          </p>
        </form>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
      />
    </div>
  );
}
