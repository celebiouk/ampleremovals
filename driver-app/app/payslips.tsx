import { View, Text } from "react-native";
import { Wallet } from "lucide-react-native";
import { Screen, Card, Badge, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { usePayslips } from "@/hooks/queries";
import { formatDate, formatCurrency } from "@/lib/format";
import { colors, radius, spacing, type } from "@/lib/theme";

const TINT: Record<string, { bg: string; fg: string }> = {
  paid: { bg: "#dcfce7", fg: "#166534" },
  pending: { bg: "#fef3c7", fg: "#92400e" },
};

export default function PayslipsScreen() {
  const list = usePayslips();

  return (
    <Screen title="Payslips" back onRefresh={() => list.refetch()} refreshing={list.isRefetching}>
      {list.isLoading ? (
        <Skeleton height={90} rounded={radius.xl} />
      ) : list.isError ? (
        <ErrorState message={(list.error as Error)?.message} onRetry={() => list.refetch()} />
      ) : (list.data?.length ?? 0) === 0 ? (
        <EmptyState title="No payslips yet" message="Your payslips will appear here once a pay run is processed." icon={<Wallet size={48} color={colors.primary.lighter} />} />
      ) : (
        (list.data ?? []).map((p) => {
          const tint = TINT[p.status] ?? TINT.pending;
          return (
            <Card key={p.id} style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={[type.mono, { color: colors.slate[500] }]}>{p.reference}</Text>
                <Badge label={p.status} bg={tint.bg} fg={tint.fg} />
              </View>
              <Text style={[type.h1, { color: colors.slate[900], marginTop: spacing.sm }]}>{formatCurrency(p.net_pay)}</Text>
              <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 2 }]}>
                Gross {formatCurrency(p.gross_earnings)} · Tips {formatCurrency(p.tips_total)} · {formatDate(p.created_at)}
              </Text>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
