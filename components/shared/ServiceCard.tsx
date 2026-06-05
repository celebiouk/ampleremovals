"use client";

import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/types";

interface ServiceCardProps {
  service: ServiceType;
  title: string;
  description: string;
  icon: LucideIcon;
  isActive?: boolean;
  onClick?: () => void;
}

/**
 * Large clickable service-selection card. Active state shows a purple border,
 * a purple background tint and a green checkmark badge; hover lifts the card.
 */
export function ServiceCard({
  title,
  description,
  icon: Icon,
  isActive = false,
  onClick,
}: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "group relative flex w-full flex-col items-start gap-4 rounded-2xl border-2 bg-white p-6 text-left transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-purple-800/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple-800 focus-visible:ring-offset-2",
        isActive
          ? "border-brand-purple-800 bg-brand-purple-50 shadow-lg shadow-brand-purple-800/10"
          : "border-border hover:border-brand-purple-300"
      )}
    >
      {isActive && (
        <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-brand-green-600 text-white shadow-sm">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      )}

      <span
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-xl transition-colors duration-300",
          isActive
            ? "bg-brand-purple-800 text-white"
            : "bg-brand-purple-100 text-brand-purple-800 group-hover:bg-brand-purple-800 group-hover:text-white"
        )}
      >
        <Icon className="h-7 w-7" />
      </span>

      <div className="space-y-1.5">
        <h3 className="font-display text-lg font-bold text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}

export default ServiceCard;
