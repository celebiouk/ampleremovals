import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANT: Record<Variant, { container: string; text: string }> = {
  primary: { container: "bg-brand-purple-800 active:bg-brand-purple-900", text: "text-white" },
  secondary: { container: "bg-brand-green-600 active:bg-brand-green-700", text: "text-white" },
  outline: { container: "border border-slate-300 active:bg-slate-100", text: "text-slate-800" },
  ghost: { container: "active:bg-slate-100", text: "text-slate-700" },
  danger: { container: "bg-red-600 active:bg-red-700", text: "text-white" },
};

const SIZE: Record<Size, { container: string; text: string }> = {
  sm: { container: "px-3 py-2 rounded-lg", text: "text-sm" },
  md: { container: "px-4 py-3 rounded-xl", text: "text-base" },
  lg: { container: "px-6 py-4 rounded-xl", text: "text-lg" },
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const v = VARIANT[variant];
  const s = SIZE[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        "flex-row items-center justify-center gap-2",
        v.container,
        s.container,
        isDisabled && "opacity-50"
      )}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={variant === "outline" || variant === "ghost" ? "#334155" : "#fff"} />}
      <Text className={cn("font-semibold", v.text, s.text)}>{label}</Text>
    </Pressable>
  );
}
