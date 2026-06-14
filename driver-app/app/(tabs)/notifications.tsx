import { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Navigation, MapPin, CheckCircle2, Package, Truck } from "lucide-react-native";
import { Screen, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useDriverNotifications } from "@/hooks/queries";
import { colors, radius, spacing, type } from "@/lib/theme";
import { formatDayLabel, formatTime } from "@/lib/format";
import type { DriverNotification } from "@/lib/types";

/** Pick an icon from the action text. */
function iconFor(action: string) {
  const a = action.toLowerCase();
  if (a.includes("complete")) return { Icon: CheckCircle2, color: colors.accent.DEFAULT };
  if (a.includes("delivery")) return { Icon: Package, color: colors.amber.DEFAULT };
  if (a.includes("pickup")) return { Icon: Truck, color: colors.primary.DEFAULT };
  if (a.includes("arriv")) return { Icon: MapPin, color: colors.blue.DEFAULT };
  if (a.includes("journey") || a.includes("way")) return { Icon: Navigation, color: colors.primary.DEFAULT };
  return { Icon: Bell, color: colors.slate[500] };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const q = useDriverNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await q.refetch();
    setRefreshing(false);
  }, [q]);

  return (
    <Screen title="Alerts" subtitle="Activity across your jobs" onRefresh={onRefresh} refreshing={refreshing}>
      {q.isLoading ? (
        [0, 1, 2, 3].map((i) => <Skeleton key={i} height={64} rounded={radius.lg} style={{ marginBottom: spacing.md }} />)
      ) : q.isError ? (
        <ErrorState message={(q.error as Error)?.message} onRetry={() => q.refetch()} />
      ) : (q.data?.length ?? 0) === 0 ? (
        <EmptyState title="All caught up" message="Updates on your jobs will show here." icon={<Bell size={52} color={colors.primary.lighter} />} />
      ) : (
        q.data!.map((n: DriverNotification) => {
          const { Icon, color } = iconFor(n.description ?? "");
          return (
            <Card key={n.id} onPress={n.booking_id ? () => router.push(`/job/${n.booking_id}`) : undefined} style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
                <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.slate[50], alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]} numberOfLines={1}>{n.title}</Text>
                  <Text style={[type.body, { color: colors.slate[600] }]} numberOfLines={2}>{n.description}</Text>
                  <Text style={[type.bodySmall, { color: colors.slate[400], marginTop: 2 }]}>
                    {formatDayLabel(n.created_at)} · {formatTime(n.created_at)}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
