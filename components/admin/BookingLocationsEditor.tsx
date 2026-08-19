"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Search, Loader2, Check, Home, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { usePostcodeLookup } from "@/hooks/usePostcodeLookup";
import type { AddressOption } from "@/types";

type Role = "pickup" | "dropoff";
type Tri = boolean | null;

export interface BookingLocation {
  id?: string;
  role: Role;
  sequence: number;
  line_1?: string | null;
  line_2?: string | null;
  city?: string | null;
  county?: string | null;
  postcode?: string | null;
  lat?: number | null;
  lng?: number | null;
  property_type?: "house" | "flat" | "bungalow" | "maisonette" | "other" | null;
  floor?: string | null;
  has_stairs?: Tri;
  num_steps?: number | null;
  has_lift?: Tri;
  has_parking?: Tri;
  narrow_access?: Tri;
  access_notes?: string | null;
}

const PROPERTY_TYPES = [
  { v: "house", l: "House" }, { v: "flat", l: "Flat" }, { v: "bungalow", l: "Bungalow" },
  { v: "maisonette", l: "Maisonette" }, { v: "other", l: "Other" },
] as const;
const FLOORS = ["ground", "1", "2", "3", "4+"];
const blank = (role: Role, sequence: number): BookingLocation => ({ role, sequence, country: "United Kingdom" } as BookingLocation);

export function BookingLocationsEditor({ bookingId }: { bookingId: string }) {
  const [locations, setLocations] = useState<BookingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/locations`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) setLocations(json.locations as BookingLocation[]);
    } finally { setLoading(false); }
  }, [bookingId]);
  useEffect(() => { load(); }, [load]);

  const pickups = locations.filter((l) => l.role === "pickup").sort((a, b) => a.sequence - b.sequence);
  const dropoffs = locations.filter((l) => l.role === "dropoff").sort((a, b) => a.sequence - b.sequence);

  function update(role: Role, sequence: number, patch: Partial<BookingLocation>) {
    setLocations((prev) => prev.map((l) => (l.role === role && l.sequence === sequence ? { ...l, ...patch } : l)));
  }
  function addStop(role: Role) {
    if (locations.filter((l) => l.role === role).length >= 2) return;
    setLocations((prev) => [...prev, blank(role, 2)]);
  }
  function removeStop(role: Role, sequence: number) {
    setLocations((prev) => prev.filter((l) => !(l.role === role && l.sequence === sequence)));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/locations`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Couldn't save");
      setLocations(json.locations as BookingLocation[]);
      setEditing(false);
      toast.success("Locations updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save locations");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>;

  // ── View mode ──
  if (!editing) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">{pickups.length} pickup{pickups.length === 1 ? "" : "s"} · {dropoffs.length} drop-off{dropoffs.length === 1 ? "" : "s"}</span>
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-lg bg-brand-purple-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-purple-900">
            <MapPin className="h-3.5 w-3.5" /> {locations.length ? "Edit locations" : "Add locations"}
          </button>
        </div>
        <div className="space-y-2">
          {[...pickups, ...dropoffs].map((l) => (
            <LocationSummary key={`${l.role}-${l.sequence}`} loc={l} />
          ))}
          {locations.length === 0 && <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">No locations recorded yet.</p>}
        </div>
      </div>
    );
  }

  // ── Edit mode ──
  return (
    <div className="space-y-4">
      <Section title="Pickup" icon={<Home className="h-4 w-4" />} role="pickup" stops={pickups} update={update} removeStop={removeStop} />
      {pickups.length < 2 && (
        <button onClick={() => addStop("pickup")} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
          <Plus className="h-3.5 w-3.5" /> Add second pickup address
        </button>
      )}
      <Section title="Drop-off" icon={<ArrowRight className="h-4 w-4" />} role="dropoff" stops={dropoffs} update={update} removeStop={removeStop} />
      {dropoffs.length < 2 && (
        <button onClick={() => addStop("dropoff")} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
          <Plus className="h-3.5 w-3.5" /> Add second drop-off address
        </button>
      )}
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <button onClick={() => { setEditing(false); load(); }} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand-purple-800 px-4 py-2 text-sm font-bold text-white hover:bg-brand-purple-900 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save locations
        </button>
      </div>
    </div>
  );
}

function LocationSummary({ loc }: { loc: BookingLocation }) {
  const addr = [loc.line_1, loc.city, loc.postcode].filter(Boolean).join(", ") || "No address";
  const bits = [
    loc.property_type && PROPERTY_TYPES.find((p) => p.v === loc.property_type)?.l,
    loc.floor && (loc.floor === "ground" ? "Ground floor" : `Floor ${loc.floor}`),
    loc.has_stairs ? `${loc.num_steps ?? "?"} steps` : null,
    loc.has_lift ? "Lift" : null,
    loc.has_parking ? "Parking" : null,
    loc.narrow_access ? "Narrow access" : null,
  ].filter(Boolean);
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${loc.role === "pickup" ? "bg-brand-purple-100 text-brand-purple-700" : "bg-brand-green-100 text-brand-green-700"}`}>
          {loc.role === "pickup" ? "PICKUP" : "DROP-OFF"}{loc.sequence > 1 ? ` ${loc.sequence}` : ""}
        </span>
        <span className="text-sm font-medium text-slate-800">{addr}</span>
      </div>
      {bits.length > 0 && <p className="mt-0.5 text-xs text-slate-500">{bits.join(" · ")}</p>}
      {loc.access_notes && <p className="mt-0.5 text-xs italic text-slate-400">{loc.access_notes}</p>}
    </div>
  );
}

function Section({ title, icon, role, stops, update, removeStop }: {
  title: string; icon: React.ReactNode; role: Role; stops: BookingLocation[];
  update: (r: Role, s: number, p: Partial<BookingLocation>) => void;
  removeStop: (r: Role, s: number) => void;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{icon} {title}</p>
      <div className="space-y-3">
        {stops.length === 0 && <p className="rounded-lg bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">No {title.toLowerCase()} yet.</p>}
        {stops.map((loc) => (
          <LocationCard key={loc.sequence} loc={loc} update={update} removeStop={removeStop} />
        ))}
      </div>
    </div>
  );
}

function LocationCard({ loc, update, removeStop }: {
  loc: BookingLocation;
  update: (r: Role, s: number, p: Partial<BookingLocation>) => void;
  removeStop: (r: Role, s: number) => void;
}) {
  const { loading, addresses, lookup } = usePostcodeLookup();
  const [pc, setPc] = useState(loc.postcode ?? "");
  const set = (p: Partial<BookingLocation>) => update(loc.role, loc.sequence, p);

  function pick(a: AddressOption) {
    set({ line_1: a.line_1, line_2: a.line_2 ?? null, city: a.city ?? null, postcode: a.postcode });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">{loc.role === "pickup" ? "Pickup" : "Drop-off"}{loc.sequence > 1 ? ` #${loc.sequence}` : ""}</span>
        {loc.sequence > 1 && (
          <button onClick={() => removeStop(loc.role, loc.sequence)} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline"><Trash2 className="h-3 w-3" /> Remove</button>
        )}
      </div>

      {/* Postcode lookup */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input value={pc} onChange={(e) => setPc(e.target.value)} placeholder="Postcode" className="h-9 w-full rounded-lg border border-slate-200 pl-8 pr-3 text-sm outline-none focus:border-brand-purple-300" />
        </div>
        <button onClick={() => lookup(pc)} disabled={loading || !pc.trim()} className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
        </button>
      </div>
      {addresses.length > 0 && (
        <select onChange={(e) => { const a = addresses[Number(e.target.value)]; if (a) pick(a); }} defaultValue="" className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-brand-purple-300">
          <option value="" disabled>Select the address…</option>
          {addresses.map((a, i) => <option key={i} value={i}>{[a.line_1, a.city, a.postcode].filter(Boolean).join(", ")}</option>)}
        </select>
      )}

      {/* Address fields */}
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input value={loc.line_1 ?? ""} onChange={(e) => set({ line_1: e.target.value })} placeholder="Address line 1" className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-300 sm:col-span-2" />
        <input value={loc.city ?? ""} onChange={(e) => set({ city: e.target.value })} placeholder="Town / city" className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-300" />
        <input value={loc.postcode ?? ""} onChange={(e) => set({ postcode: e.target.value })} placeholder="Postcode" className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-300" />
      </div>

      {/* Property details */}
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
        <label className="col-span-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Property details</label>
        <Select label="Type" value={loc.property_type ?? ""} onChange={(v) => set({ property_type: (v || null) as BookingLocation["property_type"] })} options={[["", "—"], ...PROPERTY_TYPES.map((p) => [p.v, p.l] as [string, string])]} />
        <Select label="Floor" value={loc.floor ?? ""} onChange={(v) => set({ floor: v || null })} options={[["", "—"], ...FLOORS.map((f) => [f, f === "ground" ? "Ground" : f] as [string, string])]} />
        <YesNo label="Steps to door?" value={loc.has_stairs ?? null} onChange={(v) => set({ has_stairs: v, ...(v ? {} : { num_steps: null }) })} />
        {loc.has_stairs ? (
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-500">How many steps?</label>
            <input type="number" min={0} value={loc.num_steps ?? ""} onChange={(e) => set({ num_steps: e.target.value ? Number(e.target.value) : null })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-brand-purple-300" />
          </div>
        ) : <div />}
        <YesNo label="Lift?" value={loc.has_lift ?? null} onChange={(v) => set({ has_lift: v })} />
        <YesNo label="Parking near door?" value={loc.has_parking ?? null} onChange={(v) => set({ has_parking: v })} />
        <YesNo label="Narrow door / hallway?" value={loc.narrow_access ?? null} onChange={(v) => set({ narrow_access: v })} />
        <div className="col-span-2">
          <label className="mb-1 block text-[11px] font-medium text-slate-500">Anything else about this address?</label>
          <textarea value={loc.access_notes ?? ""} onChange={(e) => set({ access_notes: e.target.value })} rows={2} placeholder="e.g. gravel driveway, key safe, awkward turn on the stairs…" className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-purple-300" />
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-slate-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-brand-purple-300">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: Tri; onChange: (v: Tri) => void }) {
  const cur = value === true ? "yes" : value === false ? "no" : "";
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-slate-500">{label}</label>
      <select value={cur} onChange={(e) => onChange(e.target.value === "yes" ? true : e.target.value === "no" ? false : null)} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-brand-purple-300">
        <option value="">—</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
  );
}
