import { View, Text } from "react-native";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { colors } from "@/lib/colors";
import { type, fonts } from "@/lib/typography";
import { radius, shadows, spacing } from "@/lib/tokens";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number | null;
  icon?: React.ReactNode;
  /** Tint for the icon block background. */
  iconTint?: string;
}

export function StatCard({ label, value, delta, icon, iconTint = colors.primary.surfaceMid }: StatCardProps) {
  const theme = useTheme();
  const showDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;

  return (
    <View
      style={[
        {
          flex: 1, padding: spacing.lg, borderRadius: radius.xl,
          backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder,
        },
        shadows.sm,
      ]}
    >
      {icon ? (
        <View
          style={{
            width: 44, height: 44, borderRadius: radius.md, marginBottom: spacing.md,
            alignItems: "center", justifyContent: "center", backgroundColor: iconTint,
          }}
        >
          {icon}
        </View>
      ) : null}
      <Text style={[type.h1, { fontSize: 26, lineHeight: 30, color: theme.text }]}>{value}</Text>
      <Text style={[type.bodySmall, { marginTop: 2, color: theme.textSecondary }]}>{label}</Text>
      {showDelta ? (
        <View style={{ marginTop: spacing.xs, flexDirection: "row", alignItems: "center", gap: 4 }}>
          {up ? <TrendingUp size={14} color={colors.accent.DEFAULT} /> : <TrendingDown size={14} color={colors.danger.DEFAULT} />}
          <Text style={[type.bodySmall, { fontFamily: fonts.bodySemiBold, color: up ? colors.accent.DEFAULT : colors.danger.DEFAULT }]}>
            {up ? "+" : ""}{delta}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}
