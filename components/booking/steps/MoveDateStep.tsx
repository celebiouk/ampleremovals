"use client";

import { useController, useFormContext } from "react-hook-form";
import { CalendarCheck, CalendarRange } from "lucide-react";
import {
  StepHeading,
  SelectableCard,
  FieldError,
} from "@/components/booking/primitives";
import { DateField } from "@/components/booking/DateField";

export function MoveDateStep() {
  const { control } = useFormContext();
  const flexible = useController({ name: "isFlexibleDate", control });
  const moveDate = useController({ name: "moveDate", control });
  const from = useController({ name: "flexibleDateFrom", control });
  const to = useController({ name: "flexibleDateTo", control });

  const isFlexible = Boolean(flexible.field.value);

  return (
    <div>
      <StepHeading
        title="When would you like to move?"
        subtitle="Pick a specific date or let us know your flexible window."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SelectableCard
          selected={!isFlexible}
          onClick={() => flexible.field.onChange(false)}
          icon={CalendarCheck}
          title="I have a specific date"
        />
        <SelectableCard
          selected={isFlexible}
          onClick={() => flexible.field.onChange(true)}
          icon={CalendarRange}
          title="I am flexible on dates"
        />
      </div>

      <div className="mt-6">
        {!isFlexible ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Preferred date
            </label>
            <DateField
              value={moveDate.field.value}
              onChange={moveDate.field.onChange}
              invalid={!!moveDate.fieldState.error}
              placeholder="Select your moving date"
            />
            <FieldError message={moveDate.fieldState.error?.message} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Earliest date
              </label>
              <DateField
                value={from.field.value}
                onChange={from.field.onChange}
                invalid={!!from.fieldState.error}
                placeholder="Earliest"
              />
              <FieldError message={from.fieldState.error?.message} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Latest date
              </label>
              <DateField
                value={to.field.value}
                onChange={to.field.onChange}
                minDate={from.field.value}
                invalid={!!to.fieldState.error}
                placeholder="Latest"
              />
              <FieldError message={to.fieldState.error?.message} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
