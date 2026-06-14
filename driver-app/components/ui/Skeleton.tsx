import { useEffect } from "react";
import { View, type DimensionValue } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius } from "@/lib/theme";

/** Shimmer skeleton — a highlight gradient slides across a muted base. */
export function Skeleton({
  width, height = 16, rounded = radius.md, style,
}: { width?: DimensionValue; height?: number; rounded?: number; style?: object }) {
  const x = useSharedValue(-1);
  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, [x]);
  const shimmer = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 240 }] }));

  return (
    <View style={[{ width, height, borderRadius: rounded, overflow: "hidden", backgroundColor: colors.slate[200] }, style]}>
      <Animated.View style={[{ position: "absolute", top: 0, bottom: 0, left: 0 }, shimmer]}>
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.7)", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: 240 }}
        />
      </Animated.View>
    </View>
  );
}
