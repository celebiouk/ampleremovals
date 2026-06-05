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

  const toggle = (key: string) => {
    setValue(`additionalServices.${key}`, !values[key], {
      shouldDirty: true,
    });
  };

  return (
    <div>
      <StepHeading
        title="Add any extra help"
        subtitle="Optional — select anything you'd like us to handle."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SERVICES.map((s) => (
          <ToggleCard
            key={s.key}
            selected={Boolean(values[s.key])}
            onClick={() => toggle(s.key)}
            icon={s.icon}
            title={s.title}
            description={s.description}
          />
        ))}
      </div>
    </div>
  );
}
