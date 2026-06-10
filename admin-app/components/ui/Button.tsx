import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { radius, shadows, spacing, MIN_TOUCH } from "@/lib/tokens";

type Variant = "primary" | "secondary" | "accent" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Lucide icon element, rendered before the label. */
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const VARIANT: Record<Variant, { bg: string; fg: string; border?: string; glow?: object }> = {
  primary:   { bg: colors.primary.DEFAULT, fg: colors.white, glow: shadows.primaryGlow },
  secondary: { bg: colors.accent.DEFAULT, fg: colors.white, glow: shadows.accentGlow },
  accent:    { bg: colors.accent.DEFAULT, fg: colors.white, glow: shadows.accentGlow },
  danger:    { bg: colors.danger.DEFAULT, fg: colors.white },
  outline:   { bg: "transparent", fg: colors.primary.DEFAULT, border: colors.primary.DEFAULT },
  ghost:     { bg: "transparent", fg: colors.primary.DEFAULT },
};

const SIZE: Record<Size, { height: number; px: number; radius: number; font: number }> = {
  sm: { height: 40, px: spacing.base, radius: radius.md, font: 14 },
  md: { height: 52, px: spacing.xl, radius: radius.lg, font: 16 },
  lg: { height: 56, px: spacing.xl, radius: radius.lg, font: 17 },
};

export function Button({
  label, variant = "primary", size = "md", loading = false, disabled, icon, onPress, ...props
}: ButtonProps) {
  const v = VARIANT[variant];
  const s = SIZE[size];
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.(e);
      }}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 20, stiffness: 320 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 280 }); }}
      style={[
        animStyle,
        {
          minHeight: Math.max(s.height, MIN_TOUCH),
          height: s.height,
          paddingHorizontal: s.px,
          borderRadius: s.radius,
          backgroundColor: v.bg,
          borderWidth: v.border ? 2 : 0,
          borderColor: v.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: isDisabled ? 0.5 : 1,
        },
        v.glow && !isDisabled ? v.glow : null,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text style={[type.button, { color: v.fg, fontSize: s.font }]}>{label}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}
