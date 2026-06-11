import { useState } from "react";
import { View, Pressable, Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LayoutGrid, ClipboardList, Sparkles, Truck, Menu } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { colors } from "@/lib/colors";
import { fonts } from "@/lib/typography";

// Fixed tab order. Any route not listed here (e.g. pipeline) is reachable but
// not shown as a tab button.
const ORDER = ["index", "bookings", "cleaners", "drivers", "more"];

const ICONS: Record<string, typeof LayoutGrid> = {
  index: LayoutGrid,
  bookings: ClipboardList,
  cleaners: Sparkles,
  drivers: Truck,
  more: Menu,
};
const LABELS: Record<string, string> = {
  index: "Dashboard", bookings: "Bookings", cleaners: "Cleaners", drivers: "Drivers", more: "More",
};

/**
 * Clean, minimal bottom tab bar in the style of modern fintech apps:
 * flat surface, a slim accent that slides to the active tab, a solid-filled
 * active icon + label in brand purple, and muted inactive items.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [barW, setBarW] = useState(width);

  const activeName = state.routes[state.index]?.name;
  const tabs = ORDER
    .map((name) => state.routes.find((r) => r.name === name))
    .filter((r): r is NonNullable<typeof r> => !!r);
  const activeIndex = tabs.findIndex((t) => t.name === activeName);
  const tabW = barW / Math.max(tabs.length, 1);
  const accentW = 26;
  const accentX = useSharedValue((activeIndex >= 0 ? activeIndex : 0) * tabW + (tabW - accentW) / 2);
  const accentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: accentX.value }],
    opacity: activeIndex >= 0 ? 1 : 0,
  }));

  return (
    <View
      onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
      style={{
        flexDirection: "row",
        backgroundColor: theme.tabBg,
        borderTopWidth: 1,
        borderTopColor: theme.tabBorder,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
        paddingTop: 4,
        height: (insets.bottom > 0 ? insets.bottom : 10) + 60,
      }}
    >
      {/* Slim sliding accent at the top edge of the active tab */}
      <Animated.View
        style={[
          { position: "absolute", top: 0, left: 0, width: accentW, height: 3, borderRadius: 3, backgroundColor: colors.primary.DEFAULT },
          accentStyle,
        ]}
      />

      {tabs.map((route, i) => {
        const focused = route.name === activeName;
        const Icon = ICONS[route.name] ?? Menu;
        const color = focused ? colors.primary.DEFAULT : colors.slate[400];

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={LABELS[route.name]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              accentX.value = withSpring(i * tabW + (tabW - accentW) / 2, { damping: 22, stiffness: 320 });
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 4, paddingTop: 8 }}
          >
            <Icon
              size={24}
              color={color}
              strokeWidth={focused ? 2.4 : 1.9}
              fill={focused ? colors.primary.surfaceMid : "transparent"}
            />
            <Text style={{ fontFamily: focused ? fonts.bodySemiBold : fonts.bodyMedium, fontSize: 11, color }}>
              {LABELS[route.name]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
