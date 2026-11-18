"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { DELIVERY_LEAD_CATEGORY_LABELS, DELIVERY_LEAD_STATUS_LABELS } from "@/lib/delivery-leads";

interface LeadDetail {
  id: string;
  business_name: string;
  category: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postcode: string | null;
  distance_miles: number | null;
  score: number;
  band: string;
  status: string;
  admin_notes: string | null;
  est_jobs_per_week: string | null;
  delivery_frequency: string | null;
  capacity_notes: string | null;
  score_breakdown: Record<string, number> | null;
}

interface ThreadEntry {
  id: string;
  direction: string;
  classification: string | null;
  subject: string | null;
  snippet: string | null;
  created_at: string;
}

interface Followup {
  id: string;
  sequence_step: number;
  due_at: string;
  sent_at: string | null;
  cancelled_at: string | null;
}

export default function DeliveryLeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [thread, setThread] = useState<ThreadEntry[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/delivery-leads/${params.id}`);
    const data = await res.json();
    if (data.success) {
      setLead(data.lead);
      setThread(data.thread);
      setFollowups(data.followups);
      setNotes(data.lead.admin_notes ?? "");
      setStatus(data.lead.status);
    }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/delivery-leads/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: notes }),
    });
    setSaving(false);
    load();
  }

  if (!lead) {
    return (
      <div className="flex items-center gap-2 p-6 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">{lead.business_name}</h1>
      <p className="mb-6 text-sm text-slate-500">
        {DELIVERY_LEAD_CATEGORY_LABELS[lead.category as keyof typeof DELIVERY_LEAD_CATEGORY_LABELS] ?? lead.category}
        {lead.distance_miles != null && ` · ${lead.distance_miles} mi`}
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Contact</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-400">Email</dt><dd className="font-medium text-slate-900">{lead.email ?? "—"}</dd></div>
              <div><dt className="text-slate-400">Phone</dt><dd className="font-medium text-slate-900">{lead.phone ?? "—"}</dd></div>
              <div><dt className="text-slate-400">Website</dt><dd className="font-medium text-slate-900">{lead.website ?? "—"}</dd></div>
              <div><dt className="text-slate-400">Address</dt><dd className="font-medium text-slate-900">{lead.address ?? "—"} {lead.postcode}</dd></div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Email thread</h2>
            {thread.length === 0 ? (
              <p className="text-sm text-slate-400">No emails sent yet — Gmail outreach isn&apos;t connected for this lead.</p>
            ) : (
              <ul className="space-y-3">
                {thread.map((t) => (
                  <li key={t.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{t.direction === "outbound" ? "Sent" : "Received"}{t.classification ? ` · ${t.classification}` : ""}</span>
                      <span>{new Date(t.created_at).toLocaleString("en-GB")}</span>
                    </div>
                    {t.subject && <div className="font-medium text-slate-900">{t.subject}</div>}
                    {t.snippet && <div className="text-slate-600">{t.snippet}</div>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Follow-ups</h2>
            {followups.length === 0 ? (
              <p className="text-sm text-slate-400">No follow-ups scheduled.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {followups.map((f) => (
                  <li key={f.id} className="flex justify-between">
                    <span>Step {f.sequence_step}</span>
                    <span className="text-slate-500">
                      {f.sent_at ? `Sent ${new Date(f.sent_at).toLocaleDateString("en-GB")}` : f.cancelled_at ? "Cancelled" : `Due ${new Date(f.due_at).toLocaleDateString("en-GB")}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Score: {lead.score} ({lead.band})</h2>
            {lead.score_breakdown && (
              <dl className="space-y-1 text-sm">
                {Object.entries(lead.score_breakdown).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><dt className="text-slate-400">{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Status &amp; notes</h2>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {Object.entries(DELIVERY_LEAD_STATUS_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Admin notes…"
            />
            <button
              onClick={save}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-purple-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-purple-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
