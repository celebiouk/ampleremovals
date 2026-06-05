"use client";

import { useController, useFormContext } from "react-hook-form";
import { Sun, Sunset, Refrigerator, Microwave, AppWindow, Layers } from "lucide-react";
import {
  StepHeading,
  OptionChip,
  ToggleCard,
  SelectableCard,
  FieldError,
} from "@/components/booking/primitives";
import { DateField } from "@/components/booking/DateField";
import { cn } from "@/lib/utils";

/* ── House clearance: items of note (multi-select chips) ──── */
const ITEMS = [
  "White Goods",
  "Furniture",
  "Garden Waste",
  "General Clutter",
  "Hazardous Items",
];

export function ItemsOfNoteStep() {
  const { control } = useFormContext();
  const { field } = useController({ name: "itemsOfNote", control });
  const selected: string[] = Array.isArray(field.value) ? field.value : [];

  const toggle = (item: string) => {
    field.onChange(
      selected.includes(item)
        ? selected.filter((i) => i !== item)
        : [...selected, item]
    );
  };

  return (
    <div>
      <StepHeading
        title="Anything of note to clear?"
        subtitle="Optional — select anything that applies."
      />
      <div className="flex flex-wrap gap-2.5">
        {ITEMS.map((item) => (
          <OptionChip
            key={item}
            selected={selected.includes(item)}
            onClick={() => toggle(item)}
            label={item}
          />
        ))}
      </div>
    </div>
  );
}

/* ── End of tenancy: add-ons (multi-select toggle cards) ──── */
const ADDONS = [
  { label: "Carpet Cleaning", description: "Deep clean of all carpets.", icon: Layers },
  { label: "Oven Cleaning", description: "Full degrease inside and out.", icon: Microwave },
  { label: "Window Cleaning", description: "Interior windows and sills.", icon: AppWindow },
  { label: "Fridge Cleaning", description: "Sanitised inside and out.", icon: Refrigerator },
];

export function AddOnsStep() {
  const { control } = useFormContext();
  const { field } = useController({ name: "addons", control });
  const selected: string[] = Array.isArray(field.value) ? field.value : [];

  const toggle = (item: string) => {
    field.onChange(
      selected.includes(item)
        ? selected.filter((i) => i !== item)
        : [...selected, item]
    );
  };

  return (
    <div>
      <StepHeading
        title="Add any extras"
        subtitle="Optional — boost your end-of-tenancy clean."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ADDONS.map((a) => (
          <ToggleCard
            key={a.label}
            selected={selected.includes(a.label)}
            onClick={() => toggle(a.label)}
            icon={a.icon}
            title={a.label}
            description={a.description}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Cleaning / EOT: access instructions (optional) ───────── */
export function AccessInstructionsStep() {
  const { control } = useFormContext();
  const { field } = useController({ name: "accessInstructions", control });
  return (
    <div>
      <StepHeading title="Any access instructions for our team?" />
      <textarea
        value={String(field.value ?? "")}
        onChange={field.onChange}
        rows={4}
        placeholder="e.g. key safe code, ring buzzer 3, park on the street etc."
        className="min-h-[110px] w-full resize-y rounded-xl border-2 border-slate-200 px-4 py-3 text-base leading-relaxed outline-none transition-colors focus:border-brand-purple-600 focus:ring-2 focus:ring-brand-purple-100"
      />
      <p className="mt-2 text-sm text-slate-400">Optional — leave blank if not needed.</p>
    </div>
  );
}

/* ── House cleaning: preferred date + time slot ───────────── */
export function CleaningDateTimeStep() {
  const { control } = useFormContext();
  const date = useController({ name: "moveDate", control });
  const slot = useController({ name: "timeSlot", control });

  return (
    <div>
      <StepHeading title="When works best for you?" />

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        Preferred date
      </label>
      <DateField
        value={date.field.value}
        onChange={date.field.onChange}
        invalid={!!date.fieldState.error}
        placeholder="Select a date"
      />
      <FieldError message={date.fieldState.error?.message} />

      <label className="mb-3 mt-7 block text-sm font-semibold text-slate-700">
        Preferred time
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SelectableCard
          selected={slot.field.value === "morning"}
          onClick={() => slot.field.onChange("morning")}
          icon={Sun}
          title="Morning"
          description="8am – 12pm"
        />
        <SelectableCard
          selected={slot.field.value === "afternoon"}
          onClick={() => slot.field.onChange("afternoon")}
          icon={Sunset}
          title="Afternoon"
          description="12pm – 5pm"
        />
      </div>
      <FieldError message={slot.fieldState.error?.message} />
    </div>
  );
}

/* ── Single date picker (e.g. tenancy end date) ───────────── */
export function SingleDateStep({
  name,
  label,
  subtitle,
}: {
  name: string;
  label: string;
  subtitle?: string;
}) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  return (
    <div>
      <StepHeading title={label} subtitle={subtitle} />
      <div className={cn("max-w-xs")}>
        <DateField
          value={field.value}
          onChange={field.onChange}
          invalid={!!fieldState.error}
          placeholder="Select a date"
        />
      </div>
      <FieldError message={fieldState.error?.message} />
    </div>
  );
}
