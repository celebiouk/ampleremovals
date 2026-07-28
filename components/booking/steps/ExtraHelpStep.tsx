"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Package, Wrench, Hammer, Boxes, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepHeading, QuantityStepper } from "@/components/booking/primitives";

/**
 * Removals "extra help" step. Unlike the shared boolean AdditionalServicesStep,
 * this collects QUANTITIES that feed the instant quote:
 *   - packing help  → hours (£35/hr)
 *   - dismantling   → items (£20 each)
 *   - assembling    → items (£20 each)
 * Packing materials stays a simple yes/no. The matching `additionalServices`
 * booleans are kept in sync so the booking's additional_services row is correct.
 */

/** A quantity-based add-on card with a stepper. */
function QuantityAddOn({
  icon: Icon,
  title,
  description,
  unit,
  value,
  onChange,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  unit: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const active = value > 0;
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border-2 bg-white p-4 transition-all",
        active ? "border-brand-purple-600 bg-brand-purple-50 shadow-sm" : "border-slate-200"
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
          active ? "bg-brand-purple-800 text-white" : "bg-brand-purple-50 text-brand-purple-800"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold text-brand-purple-950">{title}</p>
        <p className="mt-0.5 text-sm leading-snug text-slate-500">{description}</p>
        {active && (
          <p className="mt-1 text-sm font-semibold text-brand-purple-700">
            {value} {unit}
            {value === 1 ? "" : "s"}
          </p>
        )}
      </div>
      <QuantityStepper value={value} onChange={onChange} max={40} />
    </div>
  );
}

export function ExtraHelpStep() {
  const { control, setValue } = useFormContext();
  const packingHours = (useWatch({ control, name: "packingHours" }) as number) ?? 0;
  const packingMen = (useWatch({ control, name: "packingMen" }) as number) ?? 1;
  const dismantleCount = (useWatch({ control, name: "dismantleCount" }) as number) ?? 0;
  const assembleCount = (useWatch({ control, name: "assembleCount" }) as number) ?? 0;
  const services = useWatch({ control, name: "additionalServices" }) ?? {};

  /** Set a quantity field and keep its paired boolean in sync. */
  const setQuantity = (
    field: "packingHours" | "dismantleCount" | "assembleCount",
    boolKey: string,
    value: number
  ) => {
    setValue(field, value, { shouldDirty: true });
    setValue(`additionalServices.${boolKey}`, value > 0, { shouldDirty: true });
  };

  return (
    <div>
      <StepHeading
        title="Need a hand with anything?"
        subtitle="Optional extras — add only what you need."
      />

      <div className="space-y-3">
        {/* Packing help — choose the number of packers (£35/hr per man) and the hours. */}
        <div
          className={cn(
            "rounded-xl border-2 bg-white p-4 transition-all",
            packingHours > 0 ? "border-brand-purple-600 bg-brand-purple-50 shadow-sm" : "border-slate-200"
          )}
        >
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                packingHours > 0 ? "bg-brand-purple-800 text-white" : "bg-brand-purple-50 text-brand-purple-800"
              )}
            >
              <Package className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold text-brand-purple-950">Packing help</p>
              <p className="mt-0.5 text-sm leading-snug text-slate-500">Our team packs your belongings — £35 per hour, per person.</p>
            </div>
            <QuantityStepper value={packingHours} onChange={(n) => setQuantity("packingHours", "packing_services", n)} max={40} />
          </div>
          {packingHours > 0 && (
            <>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-brand-purple-100 pt-3">
                <span className="text-sm font-semibold text-slate-700">How many packers?</span>
                <div className="flex gap-2">
                  {[1, 2].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setValue("packingMen", m, { shouldDirty: true })}
                      className={cn(
                        "rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-all",
                        packingMen === m
                          ? "border-brand-purple-600 bg-brand-purple-800 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-brand-purple-300"
                      )}
                    >
                      {m} {m === 1 ? "man" : "men"}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold text-brand-purple-700">
                {packingMen} {packingMen === 1 ? "man" : "men"} × {packingHours} hour{packingHours === 1 ? "" : "s"} — £{35 * packingMen * packingHours}
              </p>
            </>
          )}
        </div>
        <QuantityAddOn
          icon={Wrench}
          title="Furniture dismantling"
          description="Beds, wardrobes, flat-pack — £20 per item."
          unit="item"
          value={dismantleCount}
          onChange={(n) => setQuantity("dismantleCount", "disassemble_furniture", n)}
        />
        <QuantityAddOn
          icon={Hammer}
          title="Furniture assembling"
          description="We rebuild it at the new place — £20 per item."
          unit="item"
          value={assembleCount}
          onChange={(n) => setQuantity("assembleCount", "assemble_furniture", n)}
        />

        {/* Packing materials — simple yes/no. */}
        <button
          type="button"
          onClick={() =>
            setValue("additionalServices.packing_materials", !services.packing_materials, {
              shouldDirty: true,
            })
          }
          className={cn(
            "flex w-full items-center gap-4 rounded-xl border-2 bg-white p-4 text-left transition-all",
            services.packing_materials
              ? "border-brand-purple-600 bg-brand-purple-50 shadow-sm"
              : "border-slate-200 hover:border-brand-purple-300"
          )}
        >
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
              services.packing_materials
                ? "bg-brand-purple-800 text-white"
                : "bg-brand-purple-50 text-brand-purple-800"
            )}
          >
            <Boxes className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold text-brand-purple-950">
              Packing materials
            </p>
            <p className="mt-0.5 text-sm leading-snug text-slate-500">
              Boxes, tape and protective wrapping supplied.
            </p>
          </div>
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all",
              services.packing_materials
                ? "border-brand-green-600 bg-brand-green-600 text-white"
                : "border-slate-300 text-transparent"
            )}
          >
            ✓
          </span>
        </button>
      </div>
    </div>
  );
}
