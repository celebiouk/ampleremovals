"use client";

import { useController, useFormContext } from "react-hook-form";
import { Building2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  StepHeading,
  SelectableCard,
  OptionChip,
} from "@/components/booking/primitives";

/* Floor levels offered when the property isn't on the ground floor. */
const FLOOR_LEVELS = ["1", "2", "3", "4", "5+"];

/** Compact Yes/No segmented control. `value` is undefined until answered. */
function YesNo({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      {[
        { label: "Yes", v: true },
        { label: "No", v: false },
      ].map((opt) => (
        <button
          key={opt.label}
          type="button"
          aria-pressed={value === opt.v}
          onClick={() => onChange(opt.v)}
          className={cn(
            "min-w-[76px] rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple-600 focus-visible:ring-offset-2",
            value === opt.v
              ? "border-brand-purple-600 bg-brand-purple-800 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:border-brand-purple-300"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Access details for the move: which floor, lift availability, parking within
 * 20m, and any special instructions. All optional — the crew uses these to plan
 * and price accurately.
 */
export function AccessStep() {
  const { control } = useFormContext();
  const floor = useController({ name: "floor", control });
  const lift = useController({ name: "hasLift", control });
  const parking = useController({ name: "parkingWithin20m", control });
  const instructions = useController({ name: "specialInstructions", control });

  const floorValue: string | undefined = floor.field.value || undefined;
  const isGround = floorValue === "ground";
  const isUpstairs = Boolean(floorValue) && !isGround;

  return (
    <div>
      <StepHeading
        title="Getting in & out"
        subtitle="A few access details so our crew can plan the move. All optional."
      />

      {/* Floor */}
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        Which floor is the property on?
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SelectableCard
          selected={isGround}
          onClick={() => {
            floor.field.onChange("ground");
            lift.field.onChange(undefined);
          }}
          icon={Home}
          title="Ground floor"
        />
        <SelectableCard
          selected={isUpstairs}
          onClick={() => floor.field.onChange(isUpstairs ? floorValue : "1")}
          icon={Building2}
          title="Upstairs"
        />
      </div>

      {isUpstairs && (
        <div className="mt-4">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Which floor?
          </span>
          <div className="flex flex-wrap gap-2.5">
            {FLOOR_LEVELS.map((level) => (
              <OptionChip
                key={level}
                selected={floorValue === level}
                onClick={() => floor.field.onChange(level)}
                label={level === "5+" ? "5th +" : `${level}${level === "1" ? "st" : level === "2" ? "nd" : level === "3" ? "rd" : "th"} floor`}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-700">
              Is there a lift?
            </span>
            <YesNo value={lift.field.value ?? undefined} onChange={lift.field.onChange} />
          </div>
        </div>
      )}

      {/* Parking */}
      <div className="mt-7 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
        <span className="text-sm font-semibold text-slate-700">
          Is there parking within 20 metres of the door?
        </span>
        <YesNo
          value={parking.field.value ?? undefined}
          onChange={parking.field.onChange}
        />
      </div>

      {/* Special instructions */}
      <div className="mt-7">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Any special instructions?
        </label>
        <textarea
          value={String(instructions.field.value ?? "")}
          onChange={instructions.field.onChange}
          rows={3}
          placeholder="e.g. narrow staircase, permit needed for the van, buzzer 4, fragile items…"
          className="min-h-[92px] w-full resize-y rounded-xl border-2 border-slate-200 px-4 py-3 text-base leading-relaxed outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
        />
        <p className="mt-2 text-sm text-slate-400">Optional — leave blank if not needed.</p>
      </div>
    </div>
  );
}
