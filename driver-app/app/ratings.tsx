import { View, Text } from "react-native";
import { Star } from "lucide-react-native";
import { Screen, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useDriverRatings } from "@/hooks/queries";
import { colors, radius, spacing, type, shadows } from "@/lib/theme";
import { formatDate, serviceLabel } from "@/lib/format";

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          color={colors.amber.DEFAULT}
          fill={i <= Math.round(value) ? colors.amber.DEFAULT : "transparent"}
        />
      ))}
    </View>
  );
}

export default function RatingsScreen() {
  const q = useDriverRatings();

  return (
    <Screen title="My Ratings" subtitle="What customers said about your jobs" back onRefresh={q.refetch} refreshing={q.isRefetching}>
      {q.isLoading ? (
        <View style={{ gap: spacing.md }}>
          <Skeleton style={{ height: 120, borderRadius: radius.xl }} />
          <Skeleton style={{ height: 90, borderRadius: radius.xl }} />
          <Skeleton style={{ height: 90, borderRadius: radius.xl }} />
        </View>
      ) : q.isError ? (
        <ErrorState message="Couldn't load your ratings." onRetry={q.refetch} />
      ) : (q.data?.count ?? 0) === 0 ? (
        <EmptyState title="No ratings yet" message="Once customers rate your completed jobs, they'll show here." />
      ) : (
        <View style={{ gap: spacing.md }}>
          {/* Average summary */}
          <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.slate[100], padding: spacing.lg, alignItems: "center", ...shadows.sm }}>
            <Text style={[type.display, { color: colors.slate[900] }]}>{q.data?.average?.toFixed(1) ?? "—"}</Text>
            <View style={{ marginVertical: spacing.xs }}>
              <Stars value={q.data?.average ?? 0} size={22} />
            </View>
            <Text style={[type.bodySmall, { color: colors.slate[500] }]}>
              {q.data?.count} {q.data?.count === 1 ? "rating" : "ratings"}
            </Text>
          </View>

          {/* Individual ratings */}
          {q.data?.ratings.map((r) => (
            <Card key={r.bookingId}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs }}>
                <Stars value={r.rating} />
                <Text style={[type.bodySmall, { color: colors.slate[400] }]}>{r.moveDate ? formatDate(r.moveDate) : ""}</Text>
              </View>
              <Text style={[type.label, { color: colors.slate[700] }]}>
                {serviceLabel(r.serviceType)}
                {r.pickupOutward ? ` · ${r.pickupOutward}` : ""}
                {r.destinationOutward ? ` → ${r.destinationOutward}` : ""}
              </Text>
              {r.feedback ? (
                <Text style={[type.body, { color: colors.slate[600], marginTop: spacing.xs, fontStyle: "italic" }]}>“{r.feedback}”</Text>
              ) : (
                <Text style={[type.bodySmall, { color: colors.slate[400], marginTop: spacing.xs }]}>No comment left</Text>
              )}
              <Text style={[type.mono, { color: colors.slate[400], marginTop: spacing.xs }]}>{r.reference}</Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
