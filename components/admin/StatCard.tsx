import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  subLabel: string;
  iconColour?: string;
  accentBorder?: boolean;
  isLoading?: boolean;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subLabel,
  iconColour = "text-brand-purple-700",
  accentBorder = false,
  isLoading = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        accentBorder ? "border-brand-green-500" : "border-slate-200"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50", iconColour)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {isLoading ? (
        <div className="mt-3 h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
      ) : (
        <p className="mt-3 font-display text-3xl font-bold text-slate-900">{value}</p>
      )}
      <p className="mt-1 text-xs text-slate-400">{subLabel}</p>
    </div>
  );
}
