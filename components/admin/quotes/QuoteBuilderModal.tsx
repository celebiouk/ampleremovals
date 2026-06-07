"use client";

import { useState, useEffect } from "react";
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
    removal_type?: string;
    bedrooms?: string | number;
    property_type?: string;
    origin_city?: string;
    destination_city?: string;
    origin_postcode?: string;
    destination_postcode?: string;
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

  // Main service description: "Removal type + bedrooms + property + service + in City"
  // Example: "Domestic removal for 4 bedroom house in Thatcham"
  let mainDescription = "";

  // Add removal type if available (e.g., "Domestic", "Commercial")
  if (serviceData.removal_type) {
    mainDescription = serviceData.removal_type.charAt(0).toUpperCase() + serviceData.removal_type.slice(1);
  }

  // Add service type
  const serviceLabel = serviceData.service_type.replace(/_/g, " ");
  if (mainDescription) {
    mainDescription += ` ${serviceLabel}`;
  } else {
    mainDescription = serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1);
  }

  // Add "for X bedroom property" if available
  if (serviceData.bedrooms && serviceData.property_type) {
    mainDescription += ` for ${serviceData.bedrooms} bedroom ${serviceData.property_type.toLowerCase()}`;
  } else if (serviceData.bedrooms) {
    mainDescription += ` for ${serviceData.bedrooms} bedroom property`;
  } else if (serviceData.property_type) {
    mainDescription += ` for ${serviceData.property_type.toLowerCase()}`;
  }

  // Add "in City" if available
  if (serviceData.origin_city) {
    mainDescription += ` in ${serviceData.origin_city}`;
  }

  items.push({
    description: mainDescription.charAt(0).toUpperCase() + mainDescription.slice(1),
    quantity: 1,
    unit_price: 0, // Admin will set price (or calculated base)
    total: 0,
  });

  // Additional services with pricing logic
  if (serviceData.additional_services && serviceData.additional_services.length > 0) {
    const bedrooms = serviceData.bedrooms;
    const bedroomNum = typeof bedrooms === "string" ? parseInt(bedrooms) || 0 : bedrooms || 0;

    serviceData.additional_services.forEach((service) => {
      let price = service.price || 0;

      // Apply bedroom-based pricing for assembly/disassembly
      if (service.name.includes("Disassemble") || service.name.includes("Assemble")) {
        if (bedroomNum === 1) {
          price = 50;
        } else if (bedroomNum === 2) {
          price = 65;
        } else if (bedroomNum >= 3) {
          price = 80;
        }
      }

      items.push({
        description: service.name,
        quantity: 1,
        unit_price: price,
        total: price,
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
  const [vatEnabled, setVatEnabled] = useState(existingQuote ? existingQuote.vat_rate > 0 : false);
  const [validUntil, setValidUntil] = useState(
    existingQuote?.valid_until || getDefaultValidUntil()
  );
  const [notes, setNotes] = useState(existingQuote?.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  function getDefaultValidUntil(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7); // 7 days from now
    return date.toISOString().split("T")[0];
  }

  // Reset form when modal opens/closes or when serviceData changes
  useEffect(() => {
    if (isOpen) {
      if (existingQuote) {
        // Editing existing quote
        setLineItems(existingQuote.line_items);
        setVatEnabled(existingQuote.vat_rate > 0);
        setValidUntil(existingQuote.valid_until || getDefaultValidUntil());
        setNotes(existingQuote.notes || "");
      } else {
        // Creating new quote - pre-populate from service data
        setLineItems(generateInitialLineItems(serviceData));
        setVatEnabled(false);
        setValidUntil(getDefaultValidUntil());
        setNotes("");
      }
    }
  }, [isOpen, existingQuote, serviceData]);

  // Calculate distance and suggest pricing when modal opens for new quotes
  useEffect(() => {
    if (
      isOpen &&
      !existingQuote &&
      serviceData?.origin_postcode &&
      serviceData?.destination_postcode
    ) {
      setCalculatingDistance(true);
      fetch("/api/postcode/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: serviceData.origin_postcode,
          to: serviceData.destination_postcode,
        }),
      })
        .then((res) => res.json())
        .then((data: { distance: number | null }) => {
          if (data.distance !== null) {
            setDistance(data.distance);

            // Calculate suggested price: £2/mile + base £50
            const baseFee = 50;
            const perMile = 2;
            const suggestedPrice = baseFee + data.distance * perMile;

            // Update the first line item price
            setLineItems((prev) => {
              if (prev.length > 0) {
                const updated = [...prev];
                updated[0] = {
                  ...updated[0],
                  unit_price: Math.round(suggestedPrice * 100) / 100,
                  total: Math.round(suggestedPrice * 100) / 100,
                };
                return updated;
              }
              return prev;
            });
          }
        })
        .catch((err) => {
          console.error("Distance calculation failed:", err);
        })
        .finally(() => {
          setCalculatingDistance(false);
        });
    }
  }, [isOpen, existingQuote, serviceData]);

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
  const vatRate = vatEnabled ? 20 : 0;
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

          {/* Distance calculation info */}
          {serviceData?.origin_postcode && serviceData?.destination_postcode && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Distance Calculation
                  </p>
                  {calculatingDistance ? (
                    <p className="text-xs text-blue-700">Calculating distance...</p>
                  ) : distance !== null ? (
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>
                        <strong>{distance} miles</strong> from {serviceData.origin_postcode} to{" "}
                        {serviceData.destination_postcode}
                      </p>
                      <p className="text-blue-600">
                        Estimated base: £{(50 + distance * 2).toFixed(2)} (£50 base + £2/mile)
                      </p>
                      <p className="text-blue-500 italic">
                        Price automatically suggested in line 1. You can edit it.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-blue-600">
                      Unable to calculate distance. Please set price manually.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VAT toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Apply VAT (20%)</p>
              <p className="text-xs text-slate-500">Adds 20% VAT to the subtotal</p>
            </div>
            <button
              type="button"
              onClick={() => setVatEnabled(!vatEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                vatEnabled ? "bg-brand-green-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  vatEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-semibold">£{subtotal.toFixed(2)}</span>
            </div>
            {vatEnabled && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">VAT (20%):</span>
                <span className="font-semibold">£{vatAmount.toFixed(2)}</span>
              </div>
            )}
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
