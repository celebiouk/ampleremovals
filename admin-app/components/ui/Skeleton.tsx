import { useEffect } from "react";
import { View, type DimensionValue } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/tokens";

interface SkeletonProps {
  className?: string;
  width?: DimensionValue;
  height?: number;
  rounded?: number;
}

/** Shimmer skeleton — a highlight gradient slides across a muted base. */
export function Skeleton({ className, width, height, rounded = radius.md }: SkeletonProps) {
  const theme = useTheme();
  const x = useSharedValue(-1);

  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, [x]);

  const shimmer = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * 220 }],
  }));

  return (
    <View
      className={cn("overflow-hidden bg-slate-200 dark:bg-slate-700", className)}
      style={[
        width != null || height != null ? { width, height } : null,
        { borderRadius: rounded },
      ]}
    >
      <Animated.View style={[{ ...StyleSheetAbsoluteFill }, shimmer]}>
        <LinearGradient
          colors={[
            "transparent",
            theme.isDark ? "rgba(148,163,184,0.18)" : "rgba(255,255,255,0.6)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: 220 }}
        />
      </Animated.View>
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  bottom: 0,
};
