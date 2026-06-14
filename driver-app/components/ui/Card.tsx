import { View, Pressable, type ViewProps, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, radius, shadows, spacing } from "@/lib/theme";

interface CardProps extends ViewProps {
  onPress?: () => void;
  /** Strong left accent line (e.g. coloured per status). */
  accent?: string;
  padded?: boolean;
}

/** Floating white surface with a soft shadow — the design system's base card. */
export function Card({ children, style, onPress, accent, padded = true, ...props }: CardProps) {
  const base: ViewStyle = {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.slate[100],
    padding: padded ? spacing.base : 0,
    borderLeftWidth: accent ? 4 : 1,
    borderLeftColor: accent ?? colors.slate[100],
    overflow: "hidden",
  };
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (onPress) {
    const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.985, { damping: 20, stiffness: 320 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 280 }); }}
        style={[base, shadows.sm, animStyle, style as ViewStyle]}
        {...(props as object)}
      >
        {children}
      </AnimatedPressable>
    );
  }
  return (
    <View style={[base, shadows.sm, style]} {...props}>
      {children}
    </View>
  );
}
