"use client";

import { useController, useFormContext } from "react-hook-form";
import { Building2, Home, Warehouse } from "lucide-react";
import {
  StepHeading,
  SelectableCard,
  OptionChip,
  FieldError,
} from "@/components/booking/primitives";

const PROPERTY_TYPES = [
  { value: "flat", label: "Flat", icon: Building2 },
  { value: "house", label: "House", icon: Home },
  { value: "bungalow", label: "Bungalow", icon: Warehouse },
] as const;

const BEDROOMS = ["studio", "1", "2", "3", "4", "5+"] as const;

export function PropertyDetailsStep({
  showBedrooms = true,
}: {
  showBedrooms?: boolean;
}) {
  const { control } = useFormContext();
  const property = useController({ name: "propertyType", control });
  const bedrooms = useController({ name: "bedrooms", control });

  return (
    <div>
      <StepHeading
        title="Tell us about the property"
        subtitle="This helps us send the right team and vehicle."
      />

      <label className="mb-3 block text-sm font-semibold text-slate-700">
        Property type
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PROPERTY_TYPES.map((p) => (
          <SelectableCard
            key={p.value}
            selected={property.field.value === p.value}
            onClick={() => property.field.onChange(p.value)}
            icon={p.icon}
            title={p.label}
          />
        ))}
      </div>
      <FieldError message={property.fieldState.error?.message} />

      {showBedrooms && (
        <div className="mt-7">
          <label className="mb-3 block text-sm font-semibold text-slate-700">
            Number of bedrooms
          </label>
          <div className="flex flex-wrap gap-2.5">
            {BEDROOMS.map((b) => (
              <OptionChip
                key={b}
                selected={bedrooms.field.value === b}
                onClick={() => bedrooms.field.onChange(b)}
                label={b === "studio" ? "Studio" : b}
              />
            ))}
          </div>
          <FieldError message={bedrooms.fieldState.error?.message} />
        </div>
      )}
    </div>
  );
}
