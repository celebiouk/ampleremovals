import { View, Text } from "react-native";
import { CheckCircle2, Star } from "lucide-react-native";
import { Screen, Card, EmptyState, ErrorState, Skeleton, Badge } from "@/components/ui";
import { useJobs } from "@/hooks/queries";
import { serviceLabel, formatDate } from "@/lib/format";
import { colors, radius, spacing, type } from "@/lib/theme";

/** Past jobs — heavily redacted: only outward postcodes + the rating survive. */
export default function CompletedScreen() {
  const jobs = useJobs("completed");

  return (
    <Screen title="Completed jobs" back onRefresh={() => jobs.refetch()} refreshing={jobs.isRefetching}>
      {jobs.isLoading ? (
        <Skeleton height={110} rounded={radius.xl} />
      ) : jobs.isError ? (
        <ErrorState message={(jobs.error as Error)?.message} onRetry={() => jobs.refetch()} />
      ) : (jobs.data?.length ?? 0) === 0 ? (
        <EmptyState title="No completed jobs yet" message="Jobs you finish will appear here." icon={<CheckCircle2 size={48} color={colors.primary.lighter} />} />
      ) : (
        (jobs.data ?? []).map((job) => (
          <Card key={job.id} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Badge label={serviceLabel(job.service_type)} bg={colors.slate[100]} fg={colors.slate[700]} />
              <Text style={[type.bodySmall, { color: colors.slate[400] }]}>{formatDate(job.move_date)}</Text>
            </View>
            <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900], marginTop: spacing.sm }]}>
              {job.origin?.postcode_outward ?? "—"}
              {job.destination?.postcode_outward ? `  →  ${job.destination.postcode_outward}` : ""}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm }}>
              {job.rating != null ? (
                <>
                  <Star size={16} color="#f59e0b" fill="#f59e0b" />
                  <Text style={[type.bodySemiBold, { color: colors.slate[700] }]}>{job.rating}/5 from the customer</Text>
                </>
              ) : (
                <Text style={[type.bodySmall, { color: colors.slate[400] }]}>Not yet rated</Text>
              )}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
