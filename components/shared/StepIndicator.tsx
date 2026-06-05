"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  /** Zero-based index of the active step. */
  currentStep: number;
  className?: string;
}

/**
 * Horizontal progress indicator. Completed steps render green with a check,
 * the active step renders in brand purple, upcoming steps are muted.
 */
export function StepIndicator({
  steps,
  currentStep,
  className,
}: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol className="flex items-center">
        {steps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={label}
              className={cn(
                "flex items-center",
                !isLast && "flex-1"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                    isCompleted &&
                      "border-brand-green-600 bg-brand-green-600 text-white",
                    isActive &&
                      "border-brand-purple-800 bg-brand-purple-800 text-white shadow-lg shadow-brand-purple-800/30 scale-110",
                    !isCompleted &&
                      !isActive &&
                      "border-border bg-white text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-center text-xs font-medium transition-colors sm:block",
                    isActive
                      ? "text-brand-purple-800"
                      : isCompleted
                        ? "text-brand-green-700"
                        : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>

              {!isLast && (
                <div className="mx-2 h-0.5 flex-1 rounded-full bg-border sm:mx-3">
                  <div
                    className={cn(
                      "h-full rounded-full bg-brand-green-600 transition-all duration-500",
                      isCompleted ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default StepIndicator;
