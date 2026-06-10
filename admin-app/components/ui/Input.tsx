import { useState } from "react";
import { TextInput, View, Text, type TextInputProps } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { cn } from "@/lib/utils";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
  labelClassName?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export function Input({
  label, error, className, labelClassName, leadingIcon, trailingIcon, onFocus, onBlur, ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-1.5">
      {label ? (
        <Text className={cn("font-semibold text-sm text-slate-700 dark:text-slate-300", labelClassName)}>
          {label}
        </Text>
      ) : null}

      <View className="relative justify-center">
        {leadingIcon ? <View className="absolute left-3.5 z-10">{leadingIcon}</View> : null}
        <TextInput
          placeholderTextColor="#94a3b8"
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          className={cn(
            "h-[52px] rounded-xl border-[1.5px] bg-white px-4 font-sans text-base text-slate-900",
            "dark:bg-slate-800 dark:text-white",
            leadingIcon && "pl-11",
            trailingIcon && "pr-11",
            focused ? "border-brand-purple-600" : "border-slate-300 dark:border-slate-700",
            error && "border-red-500",
            className
          )}
          {...props}
        />
        {trailingIcon ? <View className="absolute right-3.5 z-10">{trailingIcon}</View> : null}
      </View>

      {error ? (
        <View className="flex-row items-center gap-1">
          <AlertCircle size={13} color="#dc2626" />
          <Text className="text-xs font-medium text-red-600">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
