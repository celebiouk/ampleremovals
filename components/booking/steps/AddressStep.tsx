"use client";

import { useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { Search, Loader2, MapPin, Check, PencilLine, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePostcodeLookup } from "@/hooks/usePostcodeLookup";
import { StepHeading, FieldError } from "@/components/booking/primitives";
import type { AddressOption } from "@/types";

interface AddressStepProps {
  label: string;
  postcodeField: string;
  addressField: string;
}

/**
 * Combined postcode lookup + address selection step.
 *
 * When getAddress.io is configured (GETADDRESS_API_KEY env var), it returns
 * full property-level addresses ("1 Rosedale Gardens, Thatcham, RG19 3LE")
 * shown as a scrollable selectable list — just like comparemymove.com.
 *
 * Falls back to a simple area + manual-entry UI when only postcodes.io is
 * available (no API key configured).
 *
 * Always has an "Enter address manually" escape hatch.
 */
export function AddressStep({ label, postcodeField, addressField }: AddressStepProps) {
  const { control } = useFormContext();
  const postcodeCtrl = useController({ name: postcodeField, control });
  const addressCtrl = useController({ name: addressField, control });

  const { lookup, loading, error: lookupError, addresses } = usePostcodeLookup();

  const [searched, setSearched] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [manual, setManual] = useState(false);


  // Manual fields
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [manualPostcode, setManualPostcode] = useState(
    String(postcodeCtrl.field.value ?? "")
  );

  // When getAddress.io returns full addresses each one has a real line_1.
  // When only postcodes.io is available line_1 is empty (area-level only).
  const hasFullAddresses = addresses.length > 0 && addresses[0].line_1 !== "";

  const handleFind = async () => {
    setSearched(false);
    setSelectedIdx(null);
    addressCtrl.field.onChange(undefined);
    const found = await lookup(String(postcodeCtrl.field.value ?? ""));
    setSearched(true);
    if (found?.length) {
      setManualPostcode(found[0].postcode);
      setCity(found[0].city ?? "");
      // If only one address (area fallback) auto-select it
      if (found.length === 1 && found[0].line_1 === "") {
        setSelectedIdx(0);
        // Don't commit yet — user still needs to fill line_1
      }
    }
  };

  const selectAddress = (idx: number) => {
    setSelectedIdx(idx);
    const opt = addresses[idx];
    postcodeCtrl.field.onChange(opt.postcode);
    addressCtrl.field.onChange({
      line_1: opt.line_1,
      line_2: opt.line_2,
      city: opt.city,
      postcode: opt.postcode,
    } satisfies AddressOption);
  };

  const commitManual = (l1: string, l2: string, ct: string, pc: string) => {
    postcodeCtrl.field.onChange(pc.trim());
    if (!l1.trim()) { addressCtrl.field.onChange(undefined); return; }
    addressCtrl.field.onChange({
      line_1: l1.trim(),
      line_2: l2.trim() || undefined,
      city: ct.trim() || undefined,
      postcode: pc.trim(),
    } satisfies AddressOption);
  };

  const enterManually = () => {
    setManual(true);
    setSearched(false);
    addressCtrl.field.onChange(undefined);
  };

  const exitManual = () => {
    setManual(false);
    setSearched(false);
    addressCtrl.field.onChange(undefined);
    setLine1(""); setLine2("");
  };

  const visibleAddresses = addresses;

  /* ── Manual entry mode ────────────────────────────────────────────── */
  if (manual) {
    return (
      <div>
        <StepHeading title={label} />

        <div className="mb-5 flex items-center justify-between rounded-xl bg-brand-purple-50 px-4 py-3">
          <span className="text-sm font-semibold text-brand-purple-800">
            Entering address manually
          </span>
          <button
            type="button"
            onClick={exitManual}
            className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-purple-800"
          >
            <X className="h-4 w-4" /> Use postcode lookup
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Building number / name &amp; street <span className="text-destructive">*</span>
            </label>
            <input
              value={line1}
              onChange={(e) => { setLine1(e.target.value); commitManual(e.target.value, line2, city, manualPostcode); }}
              placeholder="e.g. 12 Rosedale Gardens"
              className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Address line 2 <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              value={line2}
              onChange={(e) => { setLine2(e.target.value); commitManual(line1, e.target.value, city, manualPostcode); }}
              placeholder="Flat, apartment, suite…"
              className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">City / Town</label>
              <input
                value={city}
                onChange={(e) => { setCity(e.target.value); commitManual(line1, line2, e.target.value, manualPostcode); }}
                placeholder="e.g. London"
                className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Postcode <span className="text-destructive">*</span>
              </label>
              <input
                value={manualPostcode}
                onChange={(e) => { const v = e.target.value.toUpperCase(); setManualPostcode(v); commitManual(line1, line2, city, v); }}
                placeholder="e.g. RG19 3LE"
                className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base font-medium uppercase outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
              />
            </div>
          </div>
        </div>

        <FieldError message={
          (addressCtrl.fieldState.error as { line_1?: { message?: string } })?.line_1?.message
          ?? addressCtrl.fieldState.error?.message
        } />
      </div>
    );
  }

  /* ── Postcode lookup mode ─────────────────────────────────────────── */
  return (
    <div>
      <StepHeading title={label} />

      {/* Postcode input + button */}
      <label className="mb-2 block text-sm font-semibold text-slate-700">Postcode</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={String(postcodeCtrl.field.value ?? "")}
          onChange={(e) => {
            postcodeCtrl.field.onChange(e.target.value.toUpperCase());
            setSearched(false);
            setSelectedIdx(null);
          }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFind(); } }}
          inputMode="text"
          autoComplete="postal-code"
          placeholder="e.g. RG19 3LE"
          className="h-12 flex-1 rounded-xl border-2 border-slate-200 px-4 text-base font-medium uppercase outline-none transition-colors placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
        />
        <button
          type="button"
          onClick={handleFind}
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-purple-800 px-6 font-bold text-white transition-colors hover:bg-brand-purple-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          Find address
        </button>
      </div>

      <FieldError message={lookupError ?? postcodeCtrl.fieldState.error?.message} />

      {/* ── Results — full individual addresses (getAddress.io) ─────── */}
      {searched && !lookupError && hasFullAddresses && (
        <div className="mt-5">
          <p className="mb-3 text-sm font-semibold text-slate-600">
            {addresses.length} address{addresses.length !== 1 ? "es" : ""} found — select yours
          </p>

          <div className="max-h-72 overflow-y-auto rounded-xl border-2 border-slate-200">
            {visibleAddresses.map((opt, idx) => {
              const fullAddress = [opt.line_1, opt.line_2, opt.city, opt.postcode]
                .filter(Boolean).join(", ");
              const selected = selectedIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectAddress(idx)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left last:border-b-0 transition-colors",
                    selected
                      ? "bg-brand-purple-50 text-brand-purple-900"
                      : "bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <MapPin className={cn("h-4 w-4 shrink-0", selected ? "text-brand-purple-600" : "text-slate-400")} />
                  <span className="flex-1 text-sm font-medium">{fullAddress}</span>
                  {selected && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green-600 text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>


          <FieldError message={addressCtrl.fieldState.error?.message} />
        </div>
      )}

      {/* ── Results — area-level fallback (postcodes.io only) ───────── */}
      {searched && !lookupError && !hasFullAddresses && addresses.length > 0 && (
        <div className="mt-5 space-y-4">
          <div className={cn(
            "flex items-center gap-3 rounded-xl border-2 px-4 py-3.5",
            "border-brand-purple-600 bg-brand-purple-50"
          )}>
            <MapPin className="h-4 w-4 shrink-0 text-brand-purple-600" />
            <span className="flex-1 text-sm font-medium text-slate-700">
              {[addresses[0].line_2, addresses[0].city, addresses[0].postcode].filter(Boolean).join(", ")}
            </span>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green-600 text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Building number / name &amp; street <span className="text-destructive">*</span>
            </label>
            <input
              value={line1}
              onChange={(e) => {
                setLine1(e.target.value);
                const opt = addresses[0];
                if (e.target.value.trim()) {
                  addressCtrl.field.onChange({
                    line_1: e.target.value.trim(),
                    line_2: opt.line_2,
                    city: opt.city,
                    postcode: opt.postcode,
                  });
                } else {
                  addressCtrl.field.onChange(undefined);
                }
              }}
              placeholder="e.g. 12 Rosedale Gardens"
              className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
            />
          </div>
          <FieldError message={
            (addressCtrl.fieldState.error as { line_1?: { message?: string } })?.line_1?.message
            ?? addressCtrl.fieldState.error?.message
          } />
        </div>
      )}

      {/* Enter manually link */}
      <button
        type="button"
        onClick={enterManually}
        className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-brand-purple-700 hover:underline"
      >
        <PencilLine className="h-4 w-4" />
        Enter address manually instead
      </button>
    </div>
  );
}
