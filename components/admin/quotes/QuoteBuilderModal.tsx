"use client";

import { useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { QuoteLineItem } from "@/types";

interface QuoteBuilderModalProps {
  bookingId: string;
  bookingReference: string;
  existingQuote?: {
    line_items: QuoteLineItem[];
    subtotal: number;
    vat_rate: number;
    vat_amount: number;
    total: number;
    valid_until: string | null;
    notes: string | null;
  };
  serviceData?: {
    service_type: string;
    bedrooms?: number;
    property_type?: string;
    additional_services?: Array<{ name: string; price?: number }>;
  };
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function generateInitialLineItems(serviceData?: QuoteBuilderModalProps["serviceData"]): QuoteLineItem[] {
  if (!serviceData) {
    return [{ description: "", quantity: 1, unit_price: 0, total: 0 }];
  }

  const items: QuoteLineItem[] = [];

  // Main service description
  let mainDescription = serviceData.service_type.replace(/_/g, " ");
  if (serviceData.bedrooms) {
    mainDescription = `${serviceData.bedrooms} bedroom ${mainDescription}`;
  }
  if (serviceData.property_type) {
    mainDescription += ` (${serviceData.property_type})`;
  }

  items.push({
    description: mainDescription.charAt(0).toUpperCase() + mainDescription.slice(1),
    quantity: 1,
    unit_price: 0, // Admin will set price
    total: 0,
  });

  // Additional services
  if (serviceData.additional_services && serviceData.additional_services.length > 0) {
    serviceData.additional_services.forEach((service) => {
      items.push({
        description: service.name,
        quantity: 1,
        unit_price: service.price || 0,
        total: service.price || 0,
      });
    });
  }

  return items;
}

export function QuoteBuilderModal({
  bookingId,
  bookingReference,
  existingQuote,
  serviceData,
  isOpen,
  onClose,
  onSaved,
}: QuoteBuilderModalProps) {
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>(
    existingQuote?.line_items || generateInitialLineItems(serviceData)
  );
  const [vatRate, setVatRate] = useState(existingQuote?.vat_rate || 20);
  const [validUntil, setValidUntil] = useState(
    existingQuote?.valid_until || getDefaultValidUntil()
  );
  const [notes, setNotes] = useState(existingQuote?.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  function getDefaultValidUntil(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7); // 7 days from now
    return date.toISOString().split("T")[0];
  }

  const updateLineItem = (index: number, field: keyof QuoteLineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    // Recalculate total for this line
    if (field === "quantity" || field === "unit_price") {
      updated[index].total = updated[index].quantity * updated[index].unit_price;
    }
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) {
      toast.error("Quote must have at least one line item");
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;

  const canSave = lineItems.every((item) => item.description.trim() && item.quantity > 0 && item.unit_price >= 0);

  const handleSave = async () => {
    if (!canSave) {
      toast.error("Please fill in all line items");
      return;
    }

    setIsSaving(true);
    const res = await fetch(`/api/admin/bookings/${bookingId}/quote/save`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        line_items: lineItems,
        subtotal,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total,
        valid_until: validUntil,
        notes: notes.trim() || null,
      }),
    });

    const json = await res.json() as { success: boolean; error?: string };
    setIsSaving(false);

    if (json.success) {
      toast.success("Quote saved successfully");
      onSaved();
      onClose();
    } else {
      toast.error(json.error || "Failed to save quote");
    }
  };

  const handleSaveAndSend = async () => {
    if (!canSave) {
      toast.error("Please fill in all line items");
      return;
    }

    setIsSending(true);

    // Save first
    const saveRes = await fetch(`/api/admin/bookings/${bookingId}/quote/save`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        line_items: lineItems,
        subtotal,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total,
        valid_until: validUntil,
        notes: notes.trim() || null,
      }),
    });

    const saveJson = await saveRes.json() as { success: boolean; error?: string };
    if (!saveJson.success) {
      toast.error(saveJson.error || "Failed to save quote");
      setIsSending(false);
      return;
    }

    // Then send
    const sendRes = await fetch(`/api/admin/bookings/${bookingId}/quote/send`, {
      method: "POST",
    });

    const sendJson = await sendRes.json() as {
      success: boolean;
      error?: string;
      channels?: { email: boolean; sms: boolean; whatsapp: boolean };
    };

    setIsSending(false);

    if (sendJson.success) {
      const { email, sms, whatsapp } = sendJson.channels || {};
      const sent = [];
      if (email) sent.push("Email");
      if (sms) sent.push("SMS");
      if (whatsapp) sent.push("WhatsApp");

      toast.success(`Quote sent via: ${sent.join(", ")}`);
      onSaved();
      onClose();
    } else {
      toast.error(sendJson.error || "Failed to send quote");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create Quote</h2>
            <p className="text-sm text-slate-600">Ref: {bookingReference}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Line Items */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Line Items
            </label>
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input
                    type="text"
                    placeholder="Description (e.g., 3-bed house removal)"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Unit Price"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(index, "unit_price", Number(e.target.value))}
                    className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <div className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-right">
                    £{item.total.toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeLineItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addLineItem}
              className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Line Item
            </button>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-semibold">£{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-slate-600">VAT:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="w-16 px-2 py-1 border border-slate-300 rounded text-sm text-right"
                />
                <span className="text-slate-600">%</span>
                <span className="font-semibold w-24 text-right">£{vatAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-slate-300 pt-2 mt-2 flex justify-between text-base">
              <span className="font-bold text-purple-700">Total:</span>
              <span className="font-bold text-purple-700">£{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Valid Until */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Valid Until
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional information for the customer..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Quote
          </button>
          <button
            onClick={handleSaveAndSend}
            disabled={!canSave || isSending}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save & Send (Email + SMS + WhatsApp)
          </button>
        </div>
      </div>
    </div>
  );
}
