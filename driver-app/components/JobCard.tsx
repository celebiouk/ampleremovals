import { View, Text } from "react-native";
import { MapPin, ChevronRight, Calendar, Clock } from "lucide-react-native";
import { Card, Badge, STATUS_TINT, SERVICE_COLOR } from "@/components/ui";
import { colors, spacing, type } from "@/lib/theme";
import { customerShortName, serviceLabel, formatDate, isToday, JOB_STATUS_LABELS } from "@/lib/format";
import type { Job } from "@/lib/types";

/** A single job summary card used across Today, Schedule and search. */
export function JobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const today = isToday(job.move_date);
  const svc = SERVICE_COLOR[job.service_type] ?? colors.primary.DEFAULT;
  const status = job.latest_driver_status ?? "not_started";
  const tint = STATUS_TINT[status] ?? STATUS_TINT.not_started;

  return (
    <Card onPress={onPress} accent={today ? colors.primary.DEFAULT : svc} style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap", marginBottom: 6 }}>
            <Badge
              label={today ? "Today" : formatDate(job.move_date)}
              bg={today ? colors.primary.surfaceMid : colors.slate[100]}
              fg={today ? colors.primary.DEFAULT : colors.slate[600]}
            />
            <Badge label={serviceLabel(job.service_type)} bg={colors.slate[100]} fg={svc} />
            {status !== "not_started" ? <Badge label={JOB_STATUS_LABELS[status] ?? status} bg={tint.bg} fg={tint.fg} dot /> : null}
          </View>

          <Text style={[type.h3, { color: colors.slate[900] }]} numberOfLines={1}>
            {customerShortName(job.customer?.full_name)}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <MapPin size={14} color={colors.slate[400]} />
            <Text style={[type.body, { color: colors.slate[600] }]} numberOfLines={1}>
              {job.origin?.postcode ?? "—"}
              {job.destination?.postcode ? `  →  ${job.destination.postcode}` : ""}
            </Text>
          </View>

          {job.move_time ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Clock size={14} color={colors.slate[400]} />
              <Text style={[type.bodySmall, { color: colors.slate[500] }]}>{job.move_time}</Text>
            </View>
          ) : null}
        </View>
        <ChevronRight size={22} color={colors.slate[300]} />
      </View>
    </Card>
  );
}

/** Compact skeleton placeholder echoing the JobCard layout. */
export function JobCardSkeletonRow() {
  return (
    <View style={{ flexDirection: "row", marginBottom: spacing.md }}>
      <View style={{ flex: 1, height: 96, borderRadius: 20, backgroundColor: colors.slate[100], borderWidth: 1, borderColor: colors.slate[100] }}>
        <View style={{ padding: spacing.base, gap: 8 }}>
          <View style={{ width: 120, height: 18, borderRadius: 6, backgroundColor: colors.slate[200] }} />
          <View style={{ width: 160, height: 14, borderRadius: 6, backgroundColor: colors.slate[200] }} />
          <Calendar size={0} />
        </View>
      </View>
    </View>
  );
}
