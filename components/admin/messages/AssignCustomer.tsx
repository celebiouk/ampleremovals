"use client";

import { useState } from "react";
import { Search, Loader2, UserPlus, X, Link2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { upperName } from "@/lib/utils";

interface CustomerHit { id: string; full_name: string; phone: string }

/** Link an unassigned conversation to a customer — search an existing one or
 *  create a new one (using the conversation's phone). */
export function AssignCustomer({
  conversationId,
  onAssigned,
}: {
  conversationId: string;
  onAssigned: (customerId: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"search" | "create">("search");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CustomerHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(term: string) {
    setQ(term);
    const clean = term.replace(/[,%]/g, "").trim();
    if (clean.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("customers")
        .select("id, full_name, phone")
        .or(`full_name.ilike.%${clean}%,phone.ilike.%${clean}%`)
        .limit(8);
      setResults((data ?? []) as CustomerHit[]);
    } finally { setSearching(false); }
  }

  async function assign(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}/assign`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "Couldn't assign");
      toast.success(`Linked to ${upperName(j.customerName)}`);
      onAssigned(j.customerId, j.customerName);
      setOpen(false); setQ(""); setResults([]); setNewName(""); setNewEmail("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't assign");
    } finally { setBusy(false); }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-brand-purple-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-purple-900">
        <Link2 className="h-3.5 w-3.5" /> Assign to customer
      </button>
    );
  }

  return (
    <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          <button onClick={() => setMode("search")} className={`rounded-md px-2 py-1 text-xs font-semibold ${mode === "search" ? "bg-brand-purple-100 text-brand-purple-800" : "text-slate-500"}`}>Existing</button>
          <button onClick={() => setMode("create")} className={`rounded-md px-2 py-1 text-xs font-semibold ${mode === "create" ? "bg-brand-purple-100 text-brand-purple-800" : "text-slate-500"}`}>New</button>
        </div>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
      </div>

      {mode === "search" ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input autoFocus value={q} onChange={(e) => search(e.target.value)} placeholder="Search name or phone…"
              className="h-9 w-full rounded-lg border border-slate-200 pl-8 pr-3 text-sm outline-none focus:border-brand-purple-300" />
          </div>
          <div className="mt-2 max-h-56 overflow-y-auto">
            {searching ? (
              <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div>
            ) : results.length === 0 ? (
              <p className="px-1 py-2 text-xs text-slate-400">{q.trim().length < 2 ? "Type to search customers" : "No matches"}</p>
            ) : results.map((c) => (
              <button key={c.id} disabled={busy} onClick={() => assign({ customerId: c.id })}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 disabled:opacity-50">
                <span className="truncate text-sm font-medium text-slate-800">{upperName(c.full_name)}</span>
                <span className="shrink-0 text-xs text-slate-400">{c.phone}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name"
            className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-300" />
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" type="email"
            className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-300" />
          <button disabled={busy || newName.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(newEmail)} onClick={() => assign({ create: { full_name: newName.trim(), email: newEmail.trim() } })}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-green-600 py-2 text-sm font-bold text-white hover:bg-brand-green-500 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Create &amp; link (phone auto-filled)
          </button>
        </div>
      )}
    </div>
  );
}
