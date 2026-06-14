import { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CalendarCheck, PoundSterling, Gift, Truck, Sun } from "lucide-react-native";
import { Screen, ErrorState } from "@/components/ui";
import { JobCard, JobCardSkeletonRow } from "@/components/JobCard";
import { ClockWidget } from "@/components/ClockWidget";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useJobs, useDriverStats, useDriverProfile } from "@/hooks/queries";
import { colors, radius, shadows, spacing, type } from "@/lib/theme";
import { formatCurrency } from "@/lib/format";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: "47%", backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.slate[100], padding: spacing.base, ...shadows.sm }}>
      <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.primary.surfaceMid, alignItems: "center", justifyContent: "center" }}>
        {icon}
      </View>
      <Text style={[type.h2, { color: colors.slate[900], marginTop: spacing.sm }]}>{value}</Text>
      <Text style={[type.bodySmall, { color: colors.slate[500] }]}>{label}</Text>
    </View>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  const jobs = useJobs("today");
  const stats = useDriverStats();
  const profile = useDriverProfile();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([jobs.refetch(), stats.refetch()]);
    setRefreshing(false);
  }, [jobs, stats]);

  const name = profile.data?.preferred_name || profile.data?.first_name || "Driver";

  return (
    <Screen title="Today" subtitle={`${greeting()}, ${name}`} onRefresh={onRefresh} refreshing={refreshing}>
      <OfflineBanner />

      {/* Stats */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.lg }}>
        <StatTile icon={<CalendarCheck size={20} color={colors.primary.DEFAULT} />} label="Jobs this week" value={String(stats.data?.jobsThisWeek ?? 0)} />
        <StatTile icon={<Truck size={20} color={colors.primary.DEFAULT} />} label="Jobs this month" value={String(stats.data?.jobsThisMonth ?? 0)} />
        <StatTile icon={<PoundSterling size={20} color={colors.accent.DEFAULT} />} label="Earnings (month)" value={formatCurrency(stats.data?.earningsThisMonth ?? 0)} />
        <StatTile icon={<Gift size={20} color={colors.amber.DEFAULT} />} label="Tips (month)" value={formatCurrency(stats.data?.tipsThisMonth ?? 0)} />
      </View>

      {/* Clock in/out */}
      <ClockWidget />

      {/* Today's jobs */}
      <Text style={[type.h3, { color: colors.slate[900], marginTop: spacing.xl, marginBottom: spacing.md }]}>Today&apos;s jobs</Text>

      {jobs.isLoading ? (
        <>
          <JobCardSkeletonRow />
          <JobCardSkeletonRow />
        </>
      ) : jobs.isError ? (
        <ErrorState message={(jobs.error as Error)?.message} onRetry={() => jobs.refetch()} />
      ) : (jobs.data?.length ?? 0) === 0 ? (
        <View style={{ marginTop: spacing.sm }}>
          <LinearGradient colors={[colors.primary.surface, colors.white]} style={{ borderRadius: radius["2xl"], padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: colors.slate[100] }}>
            <Sun size={44} color={colors.primary.lighter} />
            <Text style={[type.h3, { color: colors.slate[900], marginTop: spacing.md }]}>No jobs today</Text>
            <Text style={[type.body, { color: colors.slate[500], textAlign: "center", marginTop: 4 }]}>Enjoy the breather — check Schedule for what&apos;s coming up.</Text>
          </LinearGradient>
        </View>
      ) : (
        jobs.data!.map((job) => <JobCard key={job.id} job={job} onPress={() => router.push(`/job/${job.id}`)} />)
      )}
    </Screen>
  );
}
