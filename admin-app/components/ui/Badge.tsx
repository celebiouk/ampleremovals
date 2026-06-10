import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  /** Tailwind bg + text classes, e.g. "bg-green-100 text-green-700". */
  colour?: string;
  className?: string;
}

/**
 * Pill badge. `colour` carries both background and text classes (matching the
 * web colour maps in lib/constants), so a single string drives the look.
 */
export function Badge({ label, colour = "bg-slate-100 text-slate-700", className }: BadgeProps) {
  return (
    <View className={cn("self-start rounded-full px-3 py-1", colour, className)}>
      <Text className={cn("text-sm font-bold", colour)}>{label}</Text>
    </View>
  );
}
