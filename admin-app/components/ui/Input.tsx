import { TextInput, View, Text, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
  /** Override label colour (e.g. on always-dark screens like login). */
  labelClassName?: string;
}

export function Input({ label, error, className, labelClassName, ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text className={cn("text-sm font-medium text-slate-700 dark:text-slate-300", labelClassName)}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor="#94a3b8"
        className={cn(
          "rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900",
          "dark:border-slate-700 dark:bg-slate-800 dark:text-white",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error ? <Text className="text-xs text-red-600">{error}</Text> : null}
    </View>
  );
}
