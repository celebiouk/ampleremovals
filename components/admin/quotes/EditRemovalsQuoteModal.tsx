"use client";

import { useState } from "react";
import { X, Loader2, Send, Save } from "lucide-react";
import { toast } from "sonner";

interface EditRemovalsQuoteModalProps {
  bookingId: string;
  bookingReference: string;
  existingStandardTotal: number | null;
  existingPremiumTotal: number | null;
  existingShowPremium: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Removals-specific "Edit Quote" — the Standard/Premium tiered model (see
 * app/(public)/quote/[bookingId]/[token]/page.tsx), distinct from the
 * itemized line-item QuoteBuilderModal used for the other services. The
 * "Show Premium" toggle controls whether the customer ever hears about a
 * Premium option at all — off means one quote, no tier framing.
 */
export function EditRemovalsQuoteModal({
  bookingId,
  bookingReference,
  existingStandardTotal,
  existingPremiumTotal,
  existingShowPremium,
  isOpen,
  onClose,
  onSaved,
}: EditRemovalsQuoteModalProps) {
  const [standardTotal, setStandardTotal] = useState(existingStandardTotal != null ? String(existingStandardTotal) : "");
  const [premiumTotal, setPremiumTotal] = useState(existingPremiumTotal != null ? String(existingPremiumTotal) : "");
  const [showPremium, setShowPremium] = useState(existingShowPremium);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const std = parseFloat(standardTotal);
  const canSave = Number.isFinite(std) && std > 0;

  async function submit(send: boolean) {
    if (!canSave) {
      toast.error("Enter a valid Standard price");
      return;
    }
    send ? setSending(true) : setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/quote/tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standardTotal: std,
          premiumTotal: showPremium && premiumTotal ? parseFloat(premiumTotal) : null,
          showPremium,
          send,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(send ? (data.sent ? "Quote sent to the customer" : "Saved — sending failed, try again") : "Quote saved");
        onSaved();
        onClose();
      } else {
        toast.error(data.error || "Failed to save quote");
      }
    } catch {
      toast.error("Failed to save quote");
    } finally {
      setSaving(false);
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Quote</h2>
            <p className="text-sm text-slate-500">Ref: {bookingReference}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Standard price (£)</label>
            <input
              type="number" min="0" step="1"
              value={standardTotal}
              onChange={(e) => setStandardTotal(e.target.value)}
              placeholder="e.g. 450"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Show Premium package</p>
              <p className="text-xs text-slate-500">
                {showPremium ? "Customer sees both Standard and Premium, Premium highlighted." : "Customer sees only one quote — no Standard/Premium framing."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPremium(!showPremium)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${showPremium ? "bg-brand-green-600" : "bg-slate-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showPremium ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {showPremium && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Premium price (£)</label>
              <input
                type="number" min="0" step="1"
                value={premiumTotal}
                onChange={(e) => setPremiumTotal(e.target.value)}
                placeholder="Leave blank to use the default multiplier"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => submit(false)}
            disabled={!canSave || saving || sending}
            className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
          <button
            onClick={() => submit(true)}
            disabled={!canSave || saving || sending}
            className="flex items-center gap-2 rounded-xl bg-brand-purple-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-purple-800 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Save &amp; Send
          </button>
        </div>
      </div>
    </div>
  );
}
