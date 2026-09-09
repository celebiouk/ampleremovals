"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Copy, MessageCircle, Loader2, Check, X, Clock } from "lucide-react";

interface QueueItem {
  id: string;
  booking_id: string | null;
  customer_phone: string;
  customer_name: string | null;
  title: string;
  message: string;
  created_at: string;
  expires_at: string;
  bookings?: { reference: string } | { reference: string }[] | null;
}

function refOf(item: QueueItem): string | null {
  const b = item.bookings;
  if (!b) return null;
  return Array.isArray(b) ? (b[0]?.reference ?? null) : b.reference;
}

/** "Expires in 2d 3h" / "Expires in 41m" — recomputed every 30s. */
function useCountdown(expiresAt: string): string {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) { setLabel("Expired"); return; }
      const mins = Math.floor(ms / 60000);
      const days = Math.floor(mins / 1440);
      const hours = Math.floor((mins % 1440) / 60);
      const remMins = mins % 60;
      setLabel(days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${remMins}m` : `${remMins}m`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return label;
}

function waLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, ""); // wa.me wants digits only (no +)
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function QueueRow({ item, onHandled }: { item: QueueItem; onHandled: (id: string) => void }) {
  const countdown = useCountdown(item.expires_at);
  const [busy, setBusy] = useState<"sent" | "dismiss" | null>(null);
  const ref = refOf(item);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.message);
      toast.success("Message copied");
    } catch {
      toast.error("Couldn't copy — select and copy manually.");
    }
  };

  const markStatus = async (status: "sent" | "dismissed") => {
    setBusy(status === "sent" ? "sent" : "dismiss");
    try {
      const res = await fetch(`/api/admin/whatsapp-queue/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      onHandled(item.id);
    } catch {
      toast.error("Couldn't update — try again.");
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 break-words">
          <p className="font-display text-sm font-bold text-brand-purple-950">{item.title}</p>
          <p className="text-xs text-slate-500">
            {item.customer_name ?? "Unknown customer"} · {item.customer_phone}
            {ref ? ` · ${ref}` : ""}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
          <Clock className="h-3 w-3" /> Expires in {countdown}
        </span>
      </div>

      {/* break-words is the fix: the message includes a long unbroken quote
          link, and whitespace-pre-wrap alone preserves line breaks but never
          splits a word/URL with no spaces in it — so it was overflowing the
          card's width (page-wide scroll before AdminShell's overflow-x-hidden
          backstop; silently clipped after). break-words lets it wrap. */}
      <p className="mb-3 min-w-0 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{item.message}</p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Copy className="h-3.5 w-3.5" /> Copy message
        </button>
        <a
          href={waLink(item.customer_phone, item.message)}
          target="_blank"
          rel="noreferrer"
          onClick={() => markStatus("sent")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-bold text-white hover:brightness-95"
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
        <button
          type="button"
          onClick={() => markStatus("dismissed")}
          disabled={busy !== null}
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 disabled:opacity-50"
        >
          {busy === "dismiss" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Dismiss
        </button>
        {busy === "sent" && <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green-600"><Check className="h-3.5 w-3.5" /> Marked sent</span>}
      </div>
    </div>
  );
}

/**
 * The manual-WhatsApp queue: every customer-facing WhatsApp message the system
 * would have auto-sent is queued here instead (Twilio WhatsApp API costs add up
 * fast). Admin taps "WhatsApp" to open the customer's chat on their own business
 * number with the message pre-filled, or copies it to paste manually. Pass
 * `bookingId` to show only that booking's queue (used on the booking detail
 * page); omit it for the global queue page.
 */
export function WhatsAppQueueList({ bookingId, phone }: { bookingId?: string; phone?: string }) {
  const [items, setItems] = useState<QueueItem[] | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (bookingId) params.set("bookingId", bookingId);
    if (phone) params.set("phone", phone);
    const qs = params.toString() ? `?${params.toString()}` : "";
    try {
      const res = await fetch(`/api/admin/whatsapp-queue${qs}`);
      const data = await res.json();
      if (data.success) setItems(data.items as QueueItem[]);
    } catch { /* leave as-is */ }
  }, [bookingId, phone]);

  useEffect(() => { load(); }, [load]);

  const handled = (id: string) => setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));

  if (items === null) {
    return <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  }
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
        {bookingId ? "No pending WhatsApp messages for this booking." : "No pending WhatsApp messages — all caught up."}
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (<QueueRow key={item.id} item={item} onHandled={handled} />))}
    </div>
  );
}
