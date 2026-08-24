"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Package, Boxes, Wrench, Hammer } from "lucide-react";
import { StepHeading, ToggleCard } from "@/components/booking/primitives";

const SERVICES = [
  {
    key: "packing_services",
    title: "Packing Services",
    description: "Our team carefully packs your belongings for you.",
    icon: Package,
  },
  {
    key: "packing_materials",
    title: "Packing Materials",
    description: "Boxes, tape and protective wrapping supplied.",
    icon: Boxes,
  },
  {
    key: "disassemble_furniture",
    title: "Disassemble Furniture",
    description: "We take apart beds, wardrobes and flat-pack items.",
    icon: Wrench,
  },
  {
    key: "assemble_furniture",
    title: "Assemble Furniture",
    description: "We rebuild your furniture at the destination.",
    icon: Hammer,
  },
] as const;

export function AdditionalServicesStep() {
  const { control, setValue } = useFormContext();
  const values = useWatch({ control, name: "additionalServices" }) ?? {};
  const packingOn = Boolean(values.packing_services);

  const toggle = (key: string) => {
    // Packing materials require packing services — we only bring materials when
    // we're doing the packing (we drive them to you on the day).
    if (key === "packing_materials" && !values.packing_materials && !packingOn) return;

    const next = !values[key];
    setValue(`additionalServices.${key}`, next, { shouldDirty: true });

    // Turning packing services OFF also removes packing materials.
    if (key === "packing_services" && !next && values.packing_materials) {
      setValue("additionalServices.packing_materials", false, { shouldDirty: true });
    }
  };

  return (
    <div>
      <StepHeading
        title="Add any extra help"
        subtitle="Optional — select anything you'd like us to handle."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SERVICES.map((s) => {
          const materialsLocked = s.key === "packing_materials" && !packingOn;
          return (
            <ToggleCard
              key={s.key}
              selected={Boolean(values[s.key])}
              onClick={() => toggle(s.key)}
              icon={s.icon}
              title={s.title}
              description={materialsLocked ? "Add Packing Services first — we only bring materials when we pack for you." : s.description}
              className={materialsLocked ? "cursor-not-allowed opacity-50 hover:scale-100 hover:border-slate-200 hover:shadow-none" : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
