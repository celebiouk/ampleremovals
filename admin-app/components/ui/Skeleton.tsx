import { View } from "react-native";
import { cn } from "@/lib/utils";

/** Simple shimmer-less skeleton block (animated variant comes in a later phase). */
export function Skeleton({ className }: { className?: string }) {
  return <View className={cn("rounded-xl bg-slate-200 dark:bg-slate-800", className)} />;
}
