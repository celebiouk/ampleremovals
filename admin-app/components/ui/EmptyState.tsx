import { View, Text } from "react-native";
import { Inbox } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  /** Optional CTA. */
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, icon, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: spacing["2xl"], paddingVertical: spacing["4xl"] }}>
      {/* Decorative purple halo */}
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            position: "absolute", width: 104, height: 104, borderRadius: 52,
            backgroundColor: colors.primary.surfaceMid, opacity: theme.isDark ? 0.15 : 0.7,
          }}
        />
        {icon ?? <Inbox size={56} color={colors.primary.lighter} />}
      </View>
      <Text style={[type.h2, { marginTop: spacing.lg, textAlign: "center", color: theme.text }]}>{title}</Text>
      {message ? (
        <Text style={[type.body, { marginTop: spacing.xs, maxWidth: 280, textAlign: "center", color: theme.textSecondary }]}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.lg }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
