import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  /** Tailwind bg + text classes, e.g. "bg-green-100 text-green-700". */
  colour?: string;
  /** Semantic variant → colour (convenience used by some screens). */
  variant?: string;
  size?: "sm" | "md" | "lg";
  /** Show a leading dot in the text colour. */
  dot?: boolean;
  /** Dot colour class, e.g. "bg-green-600". */
  dotColour?: string;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any;
}

const TEXT_SIZE = { sm: "text-[11px]", md: "text-xs", lg: "text-sm" };
const PAD = { sm: "px-2.5 py-0.5", md: "px-3 py-1", lg: "px-3.5 py-1.5" };

const VARIANT_COLOUR: Record<string, string> = {
  outline: "bg-transparent text-slate-600 border border-slate-300",
  success: "bg-green-100 text-green-700",
  paid: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  deduction: "bg-red-100 text-red-700",
  advance: "bg-blue-100 text-blue-700",
  bonus: "bg-green-100 text-green-700",
  expense: "bg-slate-100 text-slate-600",
};

export function Badge({
  label, colour, variant, size = "md", dot, dotColour, className,
}: BadgeProps) {
  if (!colour) colour = (variant && VARIANT_COLOUR[variant]) || "bg-slate-100 text-slate-700";
  return (
    <View className={cn("flex-row items-center gap-1.5 self-start rounded-full", PAD[size], colour, className)}>
      {dot ? <View className={cn("h-2 w-2 rounded-full", dotColour ?? colour)} /> : null}
      <Text className={cn("font-bold", TEXT_SIZE[size], colour)}>{label}</Text>
    </View>
  );
}
