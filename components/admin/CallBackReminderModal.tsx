"use client";

import { useState } from "react";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CallBackReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  customerId: string;
  customerName: string;
  bookingReference: string;
  onSaved: () => void;
}

const REMINDER_REASONS = [
  { value: "not_sure", label: "Customer not sure yet" },
  { value: "checking_price", label: "Comparing prices" },
  { value: "waiting_decision", label: "Waiting on decision" },
  { value: "needs_more_info", label: "Needs more information" },
  { value: "call_closer_to_date", label: "Call closer to move date" },
  { value: "other", label: "Other" },
];

export function CallBackReminderModal({
  isOpen,
  onClose,
  bookingId,
  customerId,
  customerName,
  bookingReference,
  onSaved,
}: CallBackReminderModalProps) {
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("10:00");
  const [reason, setReason] = useState("not_sure");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!reminderDate) {
      toast.error("Please select a date");
      return;
    }

    setIsSaving(true);

    try {
      const reminderDatetime = `${reminderDate}T${reminderTime}:00`;

      const res = await fetch("/api/admin/call-back-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          customerId,
          reminderDatetime,
          reason,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Call back reminder set successfully");
        onSaved();
        onClose();
        // Reset form
        setReminderDate("");
        setReminderTime("10:00");
        setReason("not_sure");
        setNotes("");
      } else {
        toast.error(data.error || "Failed to set reminder");
      }
    } catch (error) {
      console.error("Error setting reminder:", error);
      toast.error("Failed to set reminder");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Set Call Back Reminder
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {customerName} — {bookingReference}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">You'll receive a reminder via:</p>
              <ul className="text-blue-800 space-y-1">
                <li>• Email to admin emails</li>
                <li>• SMS to 07344683477</li>
                <li>• WhatsApp to 07344683477</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Reminder Date
            </label>
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-purple-500 focus:border-transparent"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Reminder Time
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-purple-500 focus:border-transparent"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason for Call Back
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-purple-500 focus:border-transparent"
            >
              {REMINDER_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context for the call..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-purple-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-brand-purple-700 hover:bg-brand-purple-800"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Set Reminder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
