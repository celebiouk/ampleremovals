import { useState } from "react";
import { View, Text } from "react-native";
import { Briefcase, PoundSterling, Coins, Star, CalendarRange } from "lucide-react-native";
import { Screen, Card, Skeleton, Button } from "@/components/ui";
import { DateField } from "@/components/DateField";
import { useDriverStats, useDriverRatings, useDriverEarningsRange } from "@/hooks/queries";
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

/** YYYY-MM-DD for N days ago, in local time. */
function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PerformanceScreen() {
  const stats = useDriverStats();
  const ratings = useDriverRatings();
  const loading = stats.isLoading || ratings.isLoading;

  const [rangeFrom, setRangeFrom] = useState(daysAgo(30));
  const [rangeTo, setRangeTo] = useState(daysAgo(0));
  const range = useDriverEarningsRange(rangeFrom, rangeTo);

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

          {/* Custom date-range earnings — never the customer-paid amount, only what I earned */}
          <Text style={[type.h3, { color: colors.slate[900], marginTop: spacing.xl, marginBottom: spacing.md }]}>Earnings for a date range</Text>
          <Card>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flex: 1 }}><DateField label="From" value={rangeFrom} onChange={setRangeFrom} /></View>
              <View style={{ flex: 1 }}><DateField label="To" value={rangeTo} onChange={setRangeTo} /></View>
            </View>
            <View style={{ marginTop: spacing.md }}>
              <Button label="Check earnings" variant="outline" icon={<CalendarRange size={18} color={colors.primary.DEFAULT} />} onPress={() => range.refetch()} loading={range.isFetching} fullWidth />
            </View>
            {range.data && (
              <View style={{ marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.slate[100], paddingTop: spacing.md }}>
                <Text style={[type.h2, { color: colors.slate[900] }]}>{formatCurrency(range.data.total)}</Text>
                <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 2 }]}>
                  {range.data.jobCount} job{range.data.jobCount === 1 ? "" : "s"} · incl. {formatCurrency(range.data.tips)} tips
                </Text>
              </View>
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
