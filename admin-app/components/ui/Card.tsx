import { View, Pressable, type ViewProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { cn } from "@/lib/utils";
import { shadows } from "@/lib/tokens";

interface CardProps extends ViewProps {
  className?: string;
  /** Makes the card a pressable surface with a subtle press-scale. */
  onPress?: () => void;
  selected?: boolean;
}

const BASE = "rounded-2xl border bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700 p-4";

/** Floating surface. Soft shadow gives depth; rounded-2xl per the design system. */
export function Card({ className, children, style, onPress, selected, ...props }: CardProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (onPress) {
    const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 20, stiffness: 320 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 280 }); }}
        className={cn(BASE, selected && "border-2 border-brand-purple-600 bg-brand-purple-50", className)}
        style={[shadows.sm, animStyle, style]}
        {...(props as object)}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View className={cn(BASE, className)} style={[shadows.sm, style]} {...props}>
      {children}
    </View>
  );
}
