import { ReactNode } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { colors, spacing, type } from "@/lib/theme";

interface ScreenProps {
  children: ReactNode;
  /** Large title shown at the top. Omit for a bare screen. */
  title?: string;
  subtitle?: string;
  /** Show a back chevron (for pushed routes). */
  back?: boolean;
  /** Element rendered top-right of the header. */
  headerRight?: ReactNode;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: ViewStyle;
  bg?: string;
}

/** Standard screen frame: safe-area aware, optional large header + pull-to-refresh. */
export function Screen({
  children, title, subtitle, back, headerRight, scroll = true, onRefresh, refreshing, contentStyle, bg = colors.bg,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const header = (title || back) ? (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.base }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 36 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, flex: 1 }}>
          {back ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityLabel="Go back"
              style={{ marginLeft: -6, marginRight: 2 }}
            >
              <ChevronLeft size={30} color={colors.primary.DEFAULT} />
            </Pressable>
          ) : null}
          {title ? (
            <View style={{ flex: 1 }}>
              <Text style={[type.h1, { color: colors.slate[900] }]} numberOfLines={1}>{title}</Text>
              {subtitle ? <Text style={[type.body, { color: colors.slate[500], marginTop: 2 }]}>{subtitle}</Text> : null}
            </View>
          ) : null}
        </View>
        {headerRight ? <View>{headerRight}</View> : null}
      </View>
    </View>
  ) : null;

  const padding = { paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing["3xl"] };

  if (!scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
        {header}
        <View style={[{ flex: 1 }, padding, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      {header}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[padding, contentStyle]}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} colors={[colors.primary.DEFAULT]} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}
