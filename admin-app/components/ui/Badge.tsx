import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  /** Tailwind bg + text classes, e.g. "bg-green-100 text-green-700". */
  colour?: string;
  size?: "sm" | "md" | "lg";
  /** Show a leading dot in the text colour. */
  dot?: boolean;
  /** Dot colour class, e.g. "bg-green-600". */
  dotColour?: string;
  className?: string;
}

const TEXT_SIZE = { sm: "text-[11px]", md: "text-xs", lg: "text-sm" };
const PAD = { sm: "px-2.5 py-0.5", md: "px-3 py-1", lg: "px-3.5 py-1.5" };

export function Badge({
  label, colour = "bg-slate-100 text-slate-700", size = "md", dot, dotColour, className,
}: BadgeProps) {
  return (
    <View className={cn("flex-row items-center gap-1.5 self-start rounded-full", PAD[size], colour, className)}>
      {dot ? <View className={cn("h-2 w-2 rounded-full", dotColour ?? colour)} /> : null}
      <Text className={cn("font-bold", TEXT_SIZE[size], colour)}>{label}</Text>
    </View>
  );
}
