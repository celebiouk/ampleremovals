"use client";

import { useEffect, useState } from "react";
import { Users, Truck, Loader2, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import { VAN_SIZES, DEFAULT_CREW, defaultCrewBlurb, vanSizeLabel } from "@/lib/crew";

/**
 * Adjust the team & vehicle on a booking directly from the detail page — handy
 * after a review when one van won't do or an extra mover is needed. Saves to the
 * quote's crew fields (reflected on the customer quote + PDF/email).
 */
export function CrewEditor({ bookingId, initial }: {
  bookingId: string;
  initial: { men?: number | null; vanCount?: number | null; vanSize?: string | null; blurb?: string | null };
}) {
  const [men, setMen] = useState<number>(initial.men ?? DEFAULT_CREW.men);
  const [vanCount, setVanCount] = useState<number>(initial.vanCount ?? DEFAULT_CREW.vanCount);
  const [vanSize, setVanSize] = useState<string>(initial.vanSize ?? DEFAULT_CREW.vanSize);
  const [blurb, setBlurb] = useState<string>(initial.blurb || defaultCrewBlurb(initial.men ?? DEFAULT_CREW.men, initial.vanCount ?? DEFAULT_CREW.vanCount, initial.vanSize ?? DEFAULT_CREW.vanSize));
  const [blurbEdited, setBlurbEdited] = useState<boolean>(!!initial.blurb);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Keep the blurb in sync with the crew/van choices unless admin hand-edited it.
  useEffect(() => {
    if (!blurbEdited) setBlurb(defaultCrewBlurb(men, vanCount, vanSize));
  }, [men, vanCount, vanSize, blurbEdited]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/crew`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crew_men: men, van_count: vanCount, van_size: vanSize, crew_blurb: blurb.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Couldn't save");
      setEditing(false);
      toast.success("Team updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update the team");
    } finally { setSaving(false); }
  }

  if (!editing) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-purple-900">{men}-man team · {vanCount} × {vanSizeLabel(vanSize)}</p>
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-lg bg-brand-purple-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-purple-900">
            <Pencil className="h-3.5 w-3.5" /> Edit team
          </button>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">{blurb}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"><Users className="mr-1 inline h-3 w-3" /> Movers</label>
          <select value={men} onChange={(e) => setMen(Number(e.target.value))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-brand-purple-400">
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? "man" : "men"}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"><Truck className="mr-1 inline h-3 w-3" /> Vans</label>
          <select value={vanCount} onChange={(e) => setVanCount(Number(e.target.value))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-brand-purple-400">
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} van{n === 1 ? "" : "s"}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Van size</label>
          <select value={vanSize} onChange={(e) => setVanSize(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-brand-purple-400">
            {VAN_SIZES.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">What the customer reads</label>
          <button type="button" onClick={() => { setBlurbEdited(false); setBlurb(defaultCrewBlurb(men, vanCount, vanSize)); }} className="text-xs font-semibold text-brand-purple-700 hover:underline">Reset to default</button>
        </div>
        <textarea value={blurb} onChange={(e) => { setBlurb(e.target.value); setBlurbEdited(true); }} rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-purple-400" />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => setEditing(false)} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand-purple-800 px-4 py-2 text-sm font-bold text-white hover:bg-brand-purple-900 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save team
        </button>
      </div>
    </div>
  );
}
