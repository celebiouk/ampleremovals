import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

interface CardProps extends ViewProps {
  className?: string;
}

/** Rounded surface card — mirrors the web `rounded-2xl border bg-white` card. */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4",
        "dark:border-slate-800 dark:bg-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
