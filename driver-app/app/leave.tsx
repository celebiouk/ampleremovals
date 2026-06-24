import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { CalendarOff, Check } from "lucide-react-native";
import { Screen, Card, Button, Badge, EmptyState, ErrorState, Skeleton, toast } from "@/components/ui";
import { useLeave, useSubmitLeave } from "@/hooks/queries";
import { formatDate } from "@/lib/format";
import { colors, radius, spacing, type } from "@/lib/theme";

const TINT: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#fef3c7", fg: "#92400e" },
  approved: { bg: "#dcfce7", fg: "#166534" },
  rejected: { bg: "#fee2e2", fg: "#991b1b" },
};
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default function LeaveScreen() {
  const list = useLeave();
  const submit = useSubmitLeave();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  async function send() {
    if (!ISO.test(start)) { toast.warning("Enter a start date as YYYY-MM-DD"); return; }
    const e = ISO.test(end) ? end : start;
    try {
      await submit.mutateAsync({ start_date: start, end_date: e, reason: reason.trim() || undefined });
      toast.success("Request sent", "The office will review it");
      setStart(""); setEnd(""); setReason("");
    } catch (err) {
      toast.error("Couldn't submit", (err as Error)?.message);
    }
  }

  return (
    <Screen title="Time off" back onRefresh={() => list.refetch()} refreshing={list.isRefetching}>
      <Card>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>Request time off</Text>
        <Text style={[type.bodySmall, { color: colors.slate[500], marginBottom: spacing.md }]}>Dates as YYYY-MM-DD. Leave the end date blank for a single day.</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }}>
          <TextInput value={start} onChangeText={setStart} placeholder="Start (YYYY-MM-DD)" placeholderTextColor={colors.slate[400]} autoCapitalize="none"
            style={[type.bodyLarge, { flex: 1, color: colors.slate[900], height: 52, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md }]} />
          <TextInput value={end} onChangeText={setEnd} placeholder="End (optional)" placeholderTextColor={colors.slate[400]} autoCapitalize="none"
            style={[type.bodyLarge, { flex: 1, color: colors.slate[900], height: 52, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md }]} />
        </View>
        <TextInput value={reason} onChangeText={setReason} placeholder="Reason (optional)" placeholderTextColor={colors.slate[400]}
          style={[type.bodyLarge, { color: colors.slate[900], height: 52, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.md }]} />
        <Button label="Submit request" icon={<Check size={18} color={colors.white} />} loading={submit.isPending} onPress={send} fullWidth />
      </Card>

      <Text style={[type.label, { color: colors.slate[500], marginTop: spacing.lg, marginBottom: spacing.sm }]}>Your requests</Text>
      {list.isLoading ? (
        <Skeleton height={70} rounded={radius.xl} />
      ) : list.isError ? (
        <ErrorState message={(list.error as Error)?.message} onRetry={() => list.refetch()} />
      ) : (list.data?.length ?? 0) === 0 ? (
        <EmptyState title="No requests yet" message="Your time-off requests appear here." icon={<CalendarOff size={44} color={colors.primary.lighter} />} />
      ) : (
        (list.data ?? []).map((r) => {
          const tint = TINT[r.status] ?? TINT.pending;
          return (
            <Card key={r.id} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>
                  {formatDate(r.start_date)}{r.end_date && r.end_date !== r.start_date ? ` – ${formatDate(r.end_date)}` : ""}
                </Text>
                <Badge label={r.status} bg={tint.bg} fg={tint.fg} />
              </View>
              {r.reason ? <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 2 }]}>{r.reason}</Text> : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}
