import { View, Text } from "react-native";
import { Inbox, AlertCircle } from "lucide-react-native";
import { colors, spacing, type } from "@/lib/theme";
import { Button } from "./Button";

export function EmptyState({
  title, message, icon, actionLabel, onAction,
}: { title: string; message?: string; icon?: React.ReactNode; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing["4xl"] }}>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <View style={{ position: "absolute", width: 104, height: 104, borderRadius: 52, backgroundColor: colors.primary.surfaceMid, opacity: 0.7 }} />
        {icon ?? <Inbox size={52} color={colors.primary.lighter} />}
      </View>
      <Text style={[type.h2, { marginTop: spacing.lg, textAlign: "center", color: colors.slate[900] }]}>{title}</Text>
      {message ? (
        <Text style={[type.body, { marginTop: spacing.xs, maxWidth: 280, textAlign: "center", color: colors.slate[500] }]}>{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.lg }}><Button label={actionLabel} onPress={onAction} /></View>
      ) : null}
    </View>
  );
}

export function ErrorState({
  title = "Something went wrong", message, onRetry,
}: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing["3xl"] }}>
      <AlertCircle size={40} color={colors.danger.DEFAULT} />
      <Text style={[type.h3, { marginTop: spacing.base, textAlign: "center", color: colors.slate[800] }]}>{title}</Text>
      {message ? <Text style={[type.body, { marginTop: spacing.xs, textAlign: "center", color: colors.slate[500] }]}>{message}</Text> : null}
      {onRetry ? <View style={{ marginTop: spacing.base }}><Button label="Try again" variant="outline" size="sm" onPress={onRetry} /></View> : null}
    </View>
  );
}
