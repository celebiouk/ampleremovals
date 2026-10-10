"use client";

import { useState } from "react";
import { X, Loader2, Send, Save, Truck, Sparkles, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { HOURLY_RATE_TWO_MEN_VAN } from "@/lib/quote-engine";

interface EditRemovalsQuoteModalProps {
  bookingId: string;
  bookingReference: string;
  existingStandardTotal: number | null;
  existingPremiumTotal: number | null;
  existingShowStandard: boolean;
  existingShowPremium: boolean;
  existingShowHourly: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Removals-specific "Edit Quote" — the Standard/Premium tiered model (see
 * app/(public)/quote/[bookingId]/[token]/page.tsx), distinct from the
 * itemized line-item QuoteBuilderModal used for the other services. Three
 * independent toggles (Hourly/Standard/Premium) control what the customer is
 * actually told — any combination, including Hourly entirely on its own.
 */
export function EditRemovalsQuoteModal({
  bookingId,
  bookingReference,
  existingStandardTotal,
  existingPremiumTotal,
  existingShowStandard,
  existingShowPremium,
  existingShowHourly,
  isOpen,
  onClose,
  onSaved,
}: EditRemovalsQuoteModalProps) {
  const [standardTotal, setStandardTotal] = useState(existingStandardTotal != null ? String(existingStandardTotal) : "");
  const [premiumTotal, setPremiumTotal] = useState(existingPremiumTotal != null ? String(existingPremiumTotal) : "");
  const [showStandard, setShowStandard] = useState(existingShowStandard);
  const [showPremium, setShowPremium] = useState(existingShowPremium);
  const [showHourly, setShowHourly] = useState(existingShowHourly);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const std = parseFloat(standardTotal);
  const noOptionSelected = !showStandard && !showPremium && !showHourly;
  const canSave = Number.isFinite(std) && std > 0 && !noOptionSelected;

  async function submit(send: boolean) {
    if (noOptionSelected) {
      toast.error("Turn at least one quote option on");
      return;
    }
    if (!(Number.isFinite(std) && std > 0)) {
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
          showStandard,
          showPremium,
          showHourly,
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
          {/* Three independent quote options. */}
          <div className="grid grid-cols-3 gap-2">
            <OptionToggle icon={Clock} label="Hourly" on={showHourly} onToggle={() => setShowHourly((v) => !v)} />
            <OptionToggle icon={Truck} label="Standard" on={showStandard} onToggle={() => setShowStandard((v) => !v)} />
            <OptionToggle icon={Sparkles} label="Premium" on={showPremium} onToggle={() => setShowPremium((v) => !v)} />
          </div>
          {noOptionSelected && (
            <div className="flex items-center gap-2 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Turn at least one of these on.
            </div>
          )}
          {showHourly && (
            <p className="rounded-xl bg-teal-50 px-3 py-2 text-xs text-teal-700">
              Hourly: £{HOURLY_RATE_TWO_MEN_VAN}/hr for 2 men &amp; a van — no fixed total, just a &ldquo;call to book&rdquo; CTA.
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Standard price (£)</label>
            <input
              type="number" min="0" step="1"
              value={standardTotal}
              onChange={(e) => setStandardTotal(e.target.value)}
              placeholder="e.g. 450"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
            />
            {!showStandard && (
              <p className="mt-1 text-xs text-slate-400">Still used internally (e.g. to work out Premium) even though it&apos;s hidden from the customer.</p>
            )}
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

function OptionToggle({
  icon: Icon, label, on, onToggle,
}: {
  icon: React.ElementType;
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 transition-colors ${
        on ? "border-brand-purple-300 bg-brand-purple-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <Icon className={`h-4 w-4 ${on ? "text-brand-purple-700" : "text-slate-400"}`} />
      <span className={`text-xs font-bold ${on ? "text-brand-purple-800" : "text-slate-500"}`}>{label}</span>
      <span className={`relative h-4 w-8 rounded-full transition-colors ${on ? "bg-brand-purple-600" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}
