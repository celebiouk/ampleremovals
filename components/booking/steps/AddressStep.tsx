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

export function AddressStep({ label, postcodeField, addressField }: AddressStepProps) {
  const { control } = useFormContext();
  const postcodeCtrl = useController({ name: postcodeField, control });
  const addressCtrl = useController({ name: addressField, control });

  const { lookup, loading, error: lookupError, addresses } = usePostcodeLookup();

  const [searched, setSearched] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [manual, setManual] = useState(false);

  // Manual fields state
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState(
    String(postcodeCtrl.field.value ?? "")
  );

  const commitAddress = (addr: AddressOption) => {
    addressCtrl.field.onChange(addr);
  };

  const handleFind = async () => {
    const found = await lookup(String(postcodeCtrl.field.value ?? ""));
    setSearched(true);
    setSelectedIdx(null);
    if (found?.length) {
      // Pre-fill city from first result
      setCity(found[0].city ?? "");
      setPostcode(found[0].postcode ?? String(postcodeCtrl.field.value ?? ""));
    }
  };

  const selectAddress = (idx: number) => {
    setSelectedIdx(idx);
    const opt = addresses[idx];
    commitAddress({
      line_1: line1 || "",
      line_2: opt.line_2 ?? undefined,
      city: opt.city ?? city,
      postcode: opt.postcode,
    });
    // Sync postcode field to matched postcode
    postcodeCtrl.field.onChange(opt.postcode);
  };

  const commitManual = (l1: string, l2: string, ct: string, pc: string) => {
    if (!l1.trim()) { addressCtrl.field.onChange(undefined); return; }
    commitAddress({ line_1: l1.trim(), line_2: l2.trim() || undefined, city: ct.trim() || undefined, postcode: pc.trim() });
    postcodeCtrl.field.onChange(pc.trim());
  };

  const enterManually = () => {
    setManual(true);
    setSearched(false);
  };

  const exitManual = () => {
    setManual(false);
    addressCtrl.field.onChange(undefined);
    setLine1(""); setLine2("");
  };

  return (
    <div>
      <StepHeading title={label} />

      {/* ── Manual entry mode ───────────────────────────────── */}
      {manual ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-brand-purple-50 px-4 py-3">
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

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Building number / name &amp; street <span className="text-destructive">*</span>
            </label>
            <input
              value={line1}
              onChange={(e) => { setLine1(e.target.value); commitManual(e.target.value, line2, city, postcode); }}
              placeholder="e.g. 12 Oak Avenue"
              className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Address line 2 <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              value={line2}
              onChange={(e) => { setLine2(e.target.value); commitManual(line1, e.target.value, city, postcode); }}
              placeholder="Flat, apartment, suite, etc."
              className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">City / Town</label>
              <input
                value={city}
                onChange={(e) => { setCity(e.target.value); commitManual(line1, line2, e.target.value, postcode); }}
                placeholder="e.g. London"
                className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Postcode <span className="text-destructive">*</span>
              </label>
              <input
                value={postcode}
                onChange={(e) => { const v = e.target.value.toUpperCase(); setPostcode(v); commitManual(line1, line2, city, v); postcodeCtrl.field.onChange(v); }}
                placeholder="e.g. SW1A 1AA"
                className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base font-medium uppercase outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
              />
            </div>
          </div>
          <FieldError message={(addressCtrl.fieldState.error as { line_1?: { message?: string } })?.line_1?.message ?? addressCtrl.fieldState.error?.message} />
        </div>
      ) : (
        /* ── Postcode lookup mode ───────────────────────────── */
        <div>
          {/* Postcode input + Find button */}
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
              placeholder="e.g. SW1A 1AA"
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

          {/* Address results */}
          {searched && !lookupError && addresses.length > 0 && (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold text-slate-600">
                Select your address then add your building number/name below
              </p>

              {/* Address area cards */}
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {addresses.map((opt, idx) => {
                  const summary = [opt.line_2, opt.city, opt.postcode].filter(Boolean).join(", ");
                  const selected = selectedIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectAddress(idx)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border-2 bg-white p-3.5 text-left transition-all duration-150 hover:border-brand-purple-300",
                        selected ? "border-brand-purple-600 bg-brand-purple-50" : "border-transparent"
                      )}
                    >
                      <MapPin className={cn("h-4 w-4 shrink-0", selected ? "text-brand-purple-700" : "text-slate-400")} />
                      <span className="flex-1 text-sm font-medium text-slate-700">
                        {summary || opt.postcode}
                      </span>
                      {selected && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green-600 text-white">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Building number / name input (required) */}
              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Building number / name &amp; street <span className="text-destructive">*</span>
                </label>
                <input
                  value={line1}
                  onChange={(e) => {
                    setLine1(e.target.value);
                    if (selectedIdx !== null) {
                      const opt = addresses[selectedIdx];
                      commitAddress({
                        line_1: e.target.value.trim(),
                        line_2: opt.line_2 ?? undefined,
                        city: opt.city ?? city,
                        postcode: opt.postcode,
                      });
                    }
                  }}
                  placeholder="e.g. 42 Oak Avenue"
                  className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
                />
              </div>
            </div>
          )}

          <FieldError message={(addressCtrl.fieldState.error as { line_1?: { message?: string } })?.line_1?.message ?? addressCtrl.fieldState.error?.message} />

          {/* Enter manually link */}
          <button
            type="button"
            onClick={enterManually}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand-purple-700 hover:underline"
          >
            <PencilLine className="h-4 w-4" />
            Enter address manually instead
          </button>
        </div>
      )}
    </div>
  );
}
