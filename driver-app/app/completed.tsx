import { useMemo, useState } from "react";
import { View, Text, TextInput } from "react-native";
import { CheckCircle2, Star } from "lucide-react-native";
import { Screen, Card, EmptyState, ErrorState, Skeleton, Badge } from "@/components/ui";
import { useJobs } from "@/hooks/queries";
import { serviceLabel, formatDate } from "@/lib/format";
import { colors, radius, spacing, type } from "@/lib/theme";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Past jobs — heavily redacted: only outward postcodes + the rating survive.
 *  Filterable by a date range (a single day = same from/to). */
export default function CompletedScreen() {
  const jobs = useJobs("completed");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const all = jobs.data ?? [];
    const f = ISO.test(from) ? from : null;
    const t = ISO.test(to) ? to : f; // single date if only "from" set
    if (!f) return all;
    return all.filter((j) => {
      const d = (j.move_date ?? "").slice(0, 10);
      return d && d >= f && d <= (t ?? f);
    });
  }, [jobs.data, from, to]);

  return (
    <Screen title="Completed jobs" back onRefresh={() => jobs.refetch()} refreshing={jobs.isRefetching}>
      <Card style={{ marginBottom: spacing.base }}>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>Filter by date</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <TextInput value={from} onChangeText={setFrom} placeholder="From (YYYY-MM-DD)" placeholderTextColor={colors.slate[400]} autoCapitalize="none"
            style={[type.body, { flex: 1, color: colors.slate[900], height: 46, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md }]} />
          <TextInput value={to} onChangeText={setTo} placeholder="To (optional)" placeholderTextColor={colors.slate[400]} autoCapitalize="none"
            style={[type.body, { flex: 1, color: colors.slate[900], height: 46, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md }]} />
        </View>
      </Card>
      {jobs.isLoading ? (
        <Skeleton height={110} rounded={radius.xl} />
      ) : jobs.isError ? (
        <ErrorState message={(jobs.error as Error)?.message} onRetry={() => jobs.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No completed jobs" message={from ? "None in that date range." : "Jobs you finish will appear here."} icon={<CheckCircle2 size={48} color={colors.primary.lighter} />} />
      ) : (
        filtered.map((job) => (
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
