import { useState } from "react";
import { View, Pressable, Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LayoutDashboard, ClipboardList, Kanban, Truck, Menu } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { colors } from "@/lib/colors";
import { fonts } from "@/lib/typography";

const ICONS: Record<string, typeof LayoutDashboard> = {
  index: LayoutDashboard,
  bookings: ClipboardList,
  pipeline: Kanban,
  drivers: Truck,
  more: Menu,
};
const LABELS: Record<string, string> = {
  index: "Dashboard", bookings: "Bookings", pipeline: "Pipeline", drivers: "Drivers", more: "More",
};

/** Custom bottom tab bar — a light purple pill slides behind the active tab. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [barW, setBarW] = useState(width);

  const routes = state.routes;
  const tabW = barW / routes.length;
  const pillW = Math.min(tabW - 16, 96);
  const pillX = useSharedValue(state.index * tabW + (tabW - pillW) / 2);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View
      onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
      style={{
        flexDirection: "row",
        backgroundColor: theme.tabBg,
        borderTopWidth: 1,
        borderTopColor: theme.tabBorder,
        paddingBottom: insets.bottom,
        height: 60 + insets.bottom,
      }}
    >
      {/* Sliding pill */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 10,
            left: 0,
            width: pillW,
            height: 38,
            borderRadius: 19,
            backgroundColor: theme.isDark ? "rgba(168,85,247,0.18)" : colors.primary.surfaceMid,
          },
          pillStyle,
        ]}
      />

      {routes.map((route, i) => {
        const focused = state.index === i;
        const Icon = ICONS[route.name] ?? Menu;
        const color = focused ? colors.primary.DEFAULT : theme.textMuted;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={LABELS[route.name]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              pillX.value = withSpring(i * tabW + (tabW - pillW) / 2, { damping: 20, stiffness: 300 });
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 10, gap: 3 }}
          >
            <Icon size={24} color={color} strokeWidth={focused ? 2.2 : 1.8} />
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color }}>{LABELS[route.name]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
