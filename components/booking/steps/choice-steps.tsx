"use client";

import { useController, useFormContext } from "react-hook-form";
import { Home, Building2, Truck, Package, Boxes, Sparkles } from "lucide-react";
import {
  StepHeading,
  SelectableCard,
  OptionChip,
  FieldError,
} from "@/components/booking/primitives";

/* ── Removals: removal type ───────────────────────────────── */
export function RemovalTypeStep() {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name: "removalType", control });
  return (
    <div>
      <StepHeading
        title="What type of removal is this?"
        subtitle="Choose the option that best describes your move."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SelectableCard
          selected={field.value === "domestic"}
          onClick={() => field.onChange("domestic")}
          icon={Home}
          title="Domestic Removal"
          description="Moving home — flats, houses and everything in between."
        />
        <SelectableCard
          selected={field.value === "business"}
          onClick={() => field.onChange("business")}
          icon={Building2}
          title="Business Removal"
          description="Office and commercial relocations, handled with care."
        />
      </div>
      <FieldError message={fieldState.error?.message} />
    </div>
  );
}

/* ── Man & Van: van type ──────────────────────────────────── */
const VANS = [
  {
    value: "small",
    title: "Small Van",
    description:
      "If you just have a few items like boxes or luggage, then this is the perfect solution for you.",
  },
  {
    value: "medium",
    title: "Medium Van",
    description:
      "The perfect solution for transporting two people's belongings or items of furniture.",
  },
  {
    value: "large",
    title: "Large Van",
    description:
      "Perfect for 1 bedroom flat moves, business to business deliveries, removal services and local storage collections.",
  },
] as const;

export function VanTypeStep() {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name: "vanType", control });
  return (
    <div>
      <StepHeading
        title="Which van size do you need?"
        subtitle="Not sure? Pick the closest — we'll confirm on the call."
      />
      <div className="space-y-3">
        {VANS.map((v) => (
          <SelectableCard
            key={v.value}
            selected={field.value === v.value}
            onClick={() => field.onChange(v.value)}
            icon={Truck}
            title={v.title}
            description={v.description}
          />
        ))}
      </div>
      <FieldError message={fieldState.error?.message} />
    </div>
  );
}

/* ── House clearance: clearance type ──────────────────────── */
const CLEARANCES = [
  {
    value: "full",
    title: "Full Clearance",
    description: "We clear the entire property from top to bottom.",
  },
  {
    value: "partial",
    title: "Partial Clearance",
    description: "We clear specific rooms or areas you choose.",
  },
  {
    value: "single_room",
    title: "Single Room",
    description: "We clear just one room for you.",
  },
] as const;

export function ClearanceTypeStep() {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name: "clearanceType", control });
  return (
    <div>
      <StepHeading title="What kind of clearance do you need?" />
      <div className="space-y-3">
        {CLEARANCES.map((c) => (
          <SelectableCard
            key={c.value}
            selected={field.value === c.value}
            onClick={() => field.onChange(c.value)}
            icon={Boxes}
            title={c.title}
            description={c.description}
          />
        ))}
      </div>
      <FieldError message={fieldState.error?.message} />
    </div>
  );
}

/* ── House cleaning: cleaning type ────────────────────────── */
const CLEANINGS = [
  {
    value: "regular",
    title: "Regular Clean",
    description: "A standard clean to keep your home fresh and tidy.",
  },
  {
    value: "deep",
    title: "Deep Clean",
    description: "A thorough top-to-bottom clean of the entire property.",
  },
  {
    value: "one_off",
    title: "One-Off Clean",
    description: "A single visit clean whenever you need it.",
  },
] as const;

export function CleaningTypeStep() {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name: "cleaningType", control });
  return (
    <div>
      <StepHeading title="What type of clean do you need?" />
      <div className="space-y-3">
        {CLEANINGS.map((c) => (
          <SelectableCard
            key={c.value}
            selected={field.value === c.value}
            onClick={() => field.onChange(c.value)}
            icon={c.value === "deep" ? Sparkles : Package}
            title={c.title}
            description={c.description}
          />
        ))}
      </div>
      <FieldError message={fieldState.error?.message} />
    </div>
  );
}

/* ── House cleaning: frequency ────────────────────────────── */
const FREQUENCIES = [
  { value: "one_off", label: "One-Off" },
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
] as const;

export function FrequencyStep() {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name: "frequency", control });
  return (
    <div>
      <StepHeading
        title="How often would you like us?"
        subtitle="Choose a schedule that suits you."
      />
      <div className="flex flex-wrap gap-2.5">
        {FREQUENCIES.map((f) => (
          <OptionChip
            key={f.value}
            selected={field.value === f.value}
            onClick={() => field.onChange(f.value)}
            label={f.label}
          />
        ))}
      </div>
      <FieldError message={fieldState.error?.message} />
    </div>
  );
}
