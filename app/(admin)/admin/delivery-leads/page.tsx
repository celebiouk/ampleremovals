"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  DELIVERY_LEAD_CATEGORY_LABELS,
  DELIVERY_LEAD_STATUS_LABELS,
  type DeliveryLead,
  type DeliveryLeadBand,
} from "@/lib/delivery-leads";

const BAND_STYLES: Record<DeliveryLeadBand, string> = {
  hot: "bg-red-100 text-red-700",
  warm: "bg-amber-100 text-amber-800",
  nurture: "bg-blue-100 text-blue-700",
  cold: "bg-slate-100 text-slate-500",
};

function BandPill({ band }: { band: DeliveryLeadBand }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${BAND_STYLES[band]}`}>
      {band.charAt(0).toUpperCase() + band.slice(1)}
    </span>
  );
}

export default function DeliveryLeadsPage() {
  const [leads, setLeads] = useState<DeliveryLead[] | null>(null);
  const [category, setCategory] = useState("");
  const [band, setBand] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (band) params.set("band", band);
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/delivery-leads?${params.toString()}`);
    const data = await res.json();
    if (data.success) setLeads(data.leads);
  }, [category, band, status, q]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Delivery &amp; Collection Leads</h1>
          <p className="text-sm text-slate-500">
            Prospects for the one-Luton-van subcontracting offer at ampleremovals.com/logistics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search business name…"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">All categories</option>
            {Object.entries(DELIVERY_LEAD_CATEGORY_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
          <select value={band} onChange={(e) => setBand(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">All bands</option>
            {["hot", "warm", "nurture", "cold"].map((b) => (
              <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            {Object.entries(DELIVERY_LEAD_STATUS_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {leads === null ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : leads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
          No prospects yet. Automated discovery (Google Places) isn&apos;t wired up yet — add one manually, or ask
          Claude to finish Phase 2 once the Places API key is set.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Band</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Discovered</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/delivery-leads/${l.id}`} className="font-semibold text-blue-700 hover:underline">
                      {l.businessName}
                    </Link>
                    {l.website && <div className="text-xs text-slate-400">{l.website}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{DELIVERY_LEAD_CATEGORY_LABELS[l.category]}</td>
                  <td className="px-4 py-3 text-slate-600">{l.distanceMiles != null ? `${l.distanceMiles} mi` : "—"}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{l.score}</td>
                  <td className="px-4 py-3"><BandPill band={l.band} /></td>
                  <td className="px-4 py-3 text-slate-600">{DELIVERY_LEAD_STATUS_LABELS[l.status]}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(l.discoveredAt).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
