import { useCallback, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { CalendarDays, BellRing } from "lucide-react-native";
import { Screen, EmptyState, ErrorState } from "@/components/ui";
import { JobCard, JobCardSkeletonRow } from "@/components/JobCard";
import { PendingJobCard } from "@/components/PendingJobCard";
import { useJobs } from "@/hooks/queries";
import { colors, spacing, type } from "@/lib/theme";
import { toDateKey, formatDayLabel, isToday } from "@/lib/format";
import type { Job } from "@/lib/types";

export default function ScheduleScreen() {
  const router = useRouter();
  const jobs = useJobs("week");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await jobs.refetch();
    setRefreshing(false);
  }, [jobs]);

  // Jobs awaiting the driver's response vs. accepted (declined are hidden).
  const pending = useMemo(
    () => (jobs.data ?? []).filter((j) => (j.acceptance_status ?? "pending") === "pending"),
    [jobs.data]
  );

  // Group ACCEPTED jobs by day, sorted ascending.
  const grouped = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const j of jobs.data ?? []) {
      if (j.acceptance_status !== "accepted") continue;
      if (!j.move_date) continue;
      const key = toDateKey(new Date(j.move_date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(j);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [jobs.data]);

  return (
    <Screen title="Schedule" subtitle="The next 7 days" onRefresh={onRefresh} refreshing={refreshing}>
      {jobs.isLoading ? (
        <>
          <JobCardSkeletonRow />
          <JobCardSkeletonRow />
          <JobCardSkeletonRow />
        </>
      ) : jobs.isError ? (
        <ErrorState message={(jobs.error as Error)?.message} onRetry={() => jobs.refetch()} />
      ) : grouped.length === 0 && pending.length === 0 ? (
        <EmptyState title="Nothing scheduled" message="You have no jobs in the next 7 days." icon={<CalendarDays size={52} color={colors.primary.lighter} />} />
      ) : (
        <>
        {pending.length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
              <BellRing size={16} color={"#d97706"} />
              <Text style={[type.label, { color: "#92400e" }]}>Awaiting your response</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.slate[200] }} />
              <Text style={[type.bodySmall, { color: colors.slate[400] }]}>{pending.length}</Text>
            </View>
            {pending.map((job) => <PendingJobCard key={job.id} job={job} onPress={() => router.push(`/job/${job.id}`)} />)}
          </View>
        )}
        {grouped.map(([day, dayJobs]) => (
          <View key={day} style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
              <Text style={[type.label, { color: isToday(day) ? colors.primary.DEFAULT : colors.slate[500] }]}>
                {isToday(day) ? "Today" : formatDayLabel(day)}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.slate[200] }} />
              <Text style={[type.bodySmall, { color: colors.slate[400] }]}>{dayJobs.length} job{dayJobs.length === 1 ? "" : "s"}</Text>
            </View>
            {dayJobs.map((job) => <JobCard key={job.id} job={job} onPress={() => router.push(`/job/${job.id}`)} />)}
          </View>
        ))}
        </>
      )}
    </Screen>
  );
}
