import { View, Text } from "react-native";
import { Briefcase, PoundSterling, Coins, Star } from "lucide-react-native";
import { Screen, Card, Skeleton } from "@/components/ui";
import { useDriverStats, useDriverRatings } from "@/hooks/queries";
import { formatCurrency } from "@/lib/format";
import { colors, radius, spacing, type } from "@/lib/theme";

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card style={{ flex: 1 }}>
      <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.primary.surfaceMid, alignItems: "center", justifyContent: "center" }}>
        {icon}
      </View>
      <Text style={[type.h2, { color: colors.slate[900], marginTop: spacing.sm }]}>{value}</Text>
      <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 2 }]}>{label}</Text>
    </Card>
  );
}

export default function PerformanceScreen() {
  const stats = useDriverStats();
  const ratings = useDriverRatings();
  const loading = stats.isLoading || ratings.isLoading;

  return (
    <Screen title="My performance" onRefresh={() => { stats.refetch(); ratings.refetch(); }} refreshing={stats.isRefetching || ratings.isRefetching}>
      {loading ? (
        <Skeleton height={120} rounded={radius.xl} />
      ) : (
        <>
          <Card style={{ alignItems: "center", paddingVertical: spacing.xl }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Star size={26} color="#f59e0b" fill="#f59e0b" />
              <Text style={[type.h1, { color: colors.slate[900], fontSize: 44, lineHeight: 48 }]}>
                {ratings.data?.average != null ? ratings.data.average.toFixed(1) : "—"}
              </Text>
            </View>
            <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: spacing.sm }]}>
              Overall rating · {ratings.data?.count ?? 0} rated job{(ratings.data?.count ?? 0) === 1 ? "" : "s"}
            </Text>
          </Card>

          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.base }}>
            <Stat icon={<Briefcase size={18} color={colors.primary.DEFAULT} />} label="Jobs this week" value={String(stats.data?.jobsThisWeek ?? 0)} />
            <Stat icon={<Briefcase size={18} color={colors.primary.DEFAULT} />} label="Jobs this month" value={String(stats.data?.jobsThisMonth ?? 0)} />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
            <Stat icon={<PoundSterling size={18} color={colors.primary.DEFAULT} />} label="Earnings this month" value={formatCurrency(stats.data?.earningsThisMonth ?? 0)} />
            <Stat icon={<Coins size={18} color={colors.primary.DEFAULT} />} label="Tips this month" value={formatCurrency(stats.data?.tipsThisMonth ?? 0)} />
          </View>
        </>
      )}
    </Screen>
  );
}
