"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Star, Loader2, Send, User, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Invite {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

/**
 * Admin "Invite for Review" — enter a name + email and send a review invite for
 * anyone, no booking required. Trustpilot is BCC'd on the email (same mechanism
 * as the automatic job-completion trigger) and sends its own invite separately,
 * in its own time.
 */
export default function ReviewInvitePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  const canSubmit = name.trim().length >= 2 && email.trim() && !sending;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews/invite");
      const data = await res.json();
      if (data.success) setInvites(data.invites as Invite[]);
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const send = async (confirmAnyway = false) => {
    setSending(true);
    try {
      const res = await fetch("/api/admin/reviews/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, confirm: confirmAnyway }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.warning) {
          // Soft warning — offer to send anyway instead of blocking outright.
          toast.warning(data.error, {
            action: { label: "Send anyway", onClick: () => send(true) },
            duration: 8000,
          });
          return;
        }
        throw new Error(data.error || "Couldn't send the invite.");
      }
      toast.success(`Invite sent to ${name} — Trustpilot will follow up in their own time.`);
      setName(""); setEmail("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    send(false);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple-800 text-white">
          <Star className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-purple-950">Invite for Review</h1>
          <p className="text-sm text-slate-500">No booking needed — Trustpilot handles the actual invite, in their own time.</p>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="h-12 w-full rounded-xl border-2 border-slate-200 pl-9 pr-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
            />
          </div>
        </div>
        <div className="mb-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="h-12 w-full rounded-xl border-2 border-slate-200 pl-9 pr-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
            />
          </div>
        </div>

        <Button type="submit" disabled={!canSubmit} className="mt-4 h-12 w-full bg-brand-purple-800 text-base font-bold hover:bg-brand-purple-900 disabled:opacity-50">
          {sending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending…</> : <><Send className="mr-2 h-5 w-5" /> Send review invite</>}
        </Button>
        <p className="mt-3 text-center text-xs text-slate-400">
          Sends a short thank-you email and BCCs Trustpilot, who invite the customer for a review separately.
        </p>
      </form>

      <div className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-400" />
          <h2 className="font-display text-lg font-bold text-brand-purple-950">Recent invites</h2>
          {!loading && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{invites.length}</span>}
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : invites.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            No invites sent yet.
          </p>
        ) : (
          <div className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-purple-950">{inv.name}</p>
                  <p className="truncate text-sm text-slate-500">{inv.email}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">
                  {new Date(inv.created_at).toLocaleDateString("en-GB")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
