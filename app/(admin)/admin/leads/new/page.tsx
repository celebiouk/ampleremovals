"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  UserPlus, Loader2, CheckCircle2, Copy, Mail, MessageSquare, Phone,
  ClipboardPaste, Send, Users, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseLeadMessage } from "@/lib/parseLeadMessage";

interface LeadResult {
  reference: string;
  link: string;
}

interface PendingLead {
  id: string;
  reference: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  reminderStage: number;
  lastReminderAt: string | null;
  link: string | null;
}

/**
 * Admin "New Lead" — capture name/email/phone (typed, or pasted from the agency
 * message), fire the tri-channel invite, and manage the list of leads that
 * haven't been completed yet (with reminders).
 */
export default function NewLeadPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LeadResult | null>(null);

  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const [leads, setLeads] = useState<PendingLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const canSubmit = fullName.trim() && email.trim() && phone.trim() && !submitting;

  const loadLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch("/api/admin/leads");
      const data = await res.json();
      if (data.success) setLeads(data.leads as PendingLead[]);
    } catch {
      /* non-fatal */
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  function applyPaste() {
    const parsed = parseLeadMessage(pasteText);
    if (!parsed.fullName && !parsed.email && !parsed.phone) {
      toast.error("Couldn't find a name, email or phone in that text.");
      return;
    }
    if (parsed.fullName) setFullName(parsed.fullName);
    if (parsed.email) setEmail(parsed.email);
    if (parsed.phone) setPhone(parsed.phone);
    setShowPaste(false);
    setPasteText("");
    toast.success("Prefilled — check the details, then send.");
  }

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
      if (res.status === 409 && data.alreadyExists) {
        toast.error("This lead has already been added — see the pending list below.");
        loadLeads();
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't create the lead.");
      setResult({ reference: data.reference, link: data.link });
      setFullName(""); setEmail(""); setPhone("");
      toast.success("Lead created — invite sent by email, SMS & WhatsApp.");
      loadLeads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  async function sendReminder(id: string) {
    setRemindingId(id);
    try {
      const res = await fetch(`/api/admin/leads/${id}/remind`, { method: "POST" });
      const data = await res.json();
      if (data.success) { toast.success("Reminder sent by email, SMS & WhatsApp."); loadLeads(); }
      else toast.error(data.error || "Failed to send reminder");
    } catch {
      toast.error("Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  }

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
              <input readOnly value={result.link} className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600" />
              <Button type="button" variant="outline" onClick={() => { navigator.clipboard?.writeText(result.link); toast.success("Link copied"); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={() => setResult(null)} className="mt-6 w-full bg-brand-purple-800 hover:bg-brand-purple-900">Add another lead</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Paste-to-prefill */}
          <button
            type="button"
            onClick={() => setShowPaste((s) => !s)}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-purple-200 py-2.5 text-sm font-semibold text-brand-purple-700 hover:bg-brand-purple-50"
          >
            <ClipboardPaste className="h-4 w-4" /> Paste lead message to auto-fill
          </button>
          {showPaste && (
            <div className="mb-4">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={5}
                placeholder={"Paste the whole lead message here, e.g.\nName: Daniel\nPhone Number: 07368 274702\nemail: name@example.com"}
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-purple-600"
              />
              <Button type="button" onClick={applyPaste} className="mt-2 w-full bg-brand-purple-800 hover:bg-brand-purple-900">
                Extract &amp; prefill
              </Button>
            </div>
          )}

          <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Jane Smith" />
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="jane@example.com" />
          <Field label="Phone" type="tel" value={phone} onChange={setPhone} placeholder="07123 456789" />

          <Button type="submit" disabled={!canSubmit} className="mt-2 h-12 w-full bg-brand-green-600 text-base font-bold hover:bg-brand-green-500 disabled:opacity-50">
            {submitting ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating…</>) : "Complete & send invite"}
          </Button>
          <p className="mt-3 text-center text-xs text-slate-400">They&apos;ll get an email, SMS and WhatsApp with a link to finish their quote.</p>
        </form>
      )}

      {/* Pending leads */}
      <div className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-400" />
          <h2 className="font-display text-lg font-bold text-brand-purple-950">Pending leads</h2>
          {!loadingLeads && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{leads.length}</span>}
        </div>

        {loadingLeads ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : leads.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            No pending leads — everyone&apos;s completed their quote. 🎉
          </p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-purple-950">{lead.fullName ?? "—"}</p>
                    <p className="truncate text-sm text-slate-500">{lead.email} · {lead.phone}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      Added {new Date(lead.createdAt).toLocaleDateString("en-GB")} ·{" "}
                      {lead.reminderStage > 0 ? `${lead.reminderStage}/5 reminders sent` : "no reminders yet"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Awaiting customer</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => sendReminder(lead.id)}
                    disabled={remindingId === lead.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-purple-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-purple-900 disabled:opacity-50"
                  >
                    {remindingId === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send reminder
                  </button>
                  {lead.link && (
                    <button
                      onClick={() => { navigator.clipboard?.writeText(lead.link!); toast.success("Link copied"); }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <Copy className="h-4 w-4" /> Copy link
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
      />
    </div>
  );
}
