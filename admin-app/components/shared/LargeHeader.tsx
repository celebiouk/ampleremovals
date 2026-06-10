import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { type } from "@/lib/typography";
import { spacing, MIN_TOUCH, HIT_SLOP } from "@/lib/tokens";

interface LargeHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned action (icon button etc.). */
  right?: React.ReactNode;
}

/**
 * Clean large-title header used on the top-level tab screens — the bank-app
 * pattern: a big display title with an optional subtitle and trailing action.
 */
export function LargeHeader({ title, subtitle, right }: LargeHeaderProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
        paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md,
        backgroundColor: theme.bg,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[type.h1, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[type.body, { marginTop: 2, color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right ? <View style={{ marginLeft: spacing.md }}>{right}</View> : null}
    </View>
  );
}

/** Circular icon-button for headers (search, filter, add…). */
export function HeaderIconButton({ onPress, children, label }: { onPress: () => void; children: React.ReactNode; label: string }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2,
        alignItems: "center", justifyContent: "center",
        backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder,
      }}
    >
      {children}
    </Pressable>
  );
}
