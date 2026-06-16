import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useCountUp } from "@/hooks/useCountUp";
import { colors } from "@/lib/colors";
import { type, fonts } from "@/lib/typography";
import { radius, shadows, spacing } from "@/lib/tokens";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number | null;
  icon?: React.ReactNode;
  /** Solid tint for the icon tile (legacy). */
  iconTint?: string;
  /** Two-colour gradient for the icon tile (preferred). */
  gradient?: [string, string];
  /** Animate up to this number, formatted via `format`. Overrides `value`. */
  countTo?: number;
  format?: (n: number) => string;
  /** Semantic tint hint (accepted for convenience; styling is theme-driven). */
  variant?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any;
}

export function StatCard({
  label, value, delta, icon, iconTint, gradient, countTo, format, style,
}: StatCardProps) {
  const theme = useTheme();
  const animated = useCountUp(countTo ?? 0);
  const display = countTo != null && format ? format(animated) : value;
  const showDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;
  const tile = gradient ?? ([iconTint ?? colors.primary.surfaceMid, iconTint ?? colors.primary.lighter] as [string, string]);

  return (
    <View
      style={[
        {
          flex: 1, padding: spacing.lg, borderRadius: radius.xl,
          backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder,
        },
        shadows.md,
        style,
      ]}
    >
      {icon ? (
        <LinearGradient
          colors={tile}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 46, height: 46, borderRadius: radius.md, marginBottom: spacing.md, alignItems: "center", justifyContent: "center" }}
        >
          {icon}
        </LinearGradient>
      ) : null}
      <Text style={[type.h1, { fontSize: 26, lineHeight: 30, color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {display}
      </Text>
      <Text style={[type.bodySmall, { marginTop: 2, color: theme.textSecondary }]}>{label}</Text>
      {showDelta ? (
        <View style={{ marginTop: spacing.xs, flexDirection: "row", alignItems: "center", gap: 4 }}>
          {up ? <TrendingUp size={14} color={colors.accent.DEFAULT} /> : <TrendingDown size={14} color={colors.danger.DEFAULT} />}
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: up ? colors.accent.DEFAULT : colors.danger.DEFAULT }}>
            {up ? "+" : ""}{delta}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}
