import { useEffect, useState } from "react";
import { ScrollView, View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { AlertCircle, TrendingUp } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton, StatCard, Badge } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface ComplianceStats {
  total_workers: number;
  total_gross: number;
  total_estimated_tax: number;
  total_estimated_ni: number;
  status_breakdown: {
    ok: number;
    warning: number;
    alert: number;
  };
  high_earners: Array<{
    worker_id: string;
    total_gross: number;
    estimated_tax: number;
  }>;
}

export default function ComplianceScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        const response = await apiFetch("/api/admin/payroll/compliance");
        const data = await response.json();
        if (data.success) {
          setStats(data.compliance.stats);
          setWorkers(data.compliance.worker_breakdown);
        }
      } catch (e) {
        console.error("Failed to fetch compliance:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchCompliance();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ marginBottom: spacing.base, height: 100, borderRadius: 16 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="Compliance" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[type.body, { color: colors.slate[600] }]}>No data</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Tax & Compliance" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Summary */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatCard
              icon="Users"
              label="Workers"
              value={String(stats.total_workers)}
              variant="primary"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="AlertTriangle"
              label="Est. Tax"
              value={formatCurrency(stats.total_estimated_tax)}
              variant="accent"
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* Compliance status */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            Compliance Status
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Card
              style={{
                flex: 1,
                padding: spacing.base,
                alignItems: "center",
                backgroundColor: colors.accent.surface,
              }}
            >
              <Text style={[type.h3, { color: colors.accent.DEFAULT }]}>{stats.status_breakdown.ok}</Text>
              <Text style={[type.bodySmall, { color: colors.accent.DEFAULT, marginTop: spacing.sm }]}>OK</Text>
            </Card>
            <Card
              style={{
                flex: 1,
                padding: spacing.base,
                alignItems: "center",
                backgroundColor: colors.primary.surface,
              }}
            >
              <Text style={[type.h3, { color: colors.primary.DEFAULT }]}>
                {stats.status_breakdown.warning}
              </Text>
              <Text style={[type.bodySmall, { color: colors.primary.DEFAULT, marginTop: spacing.sm }]}>
                Warning
              </Text>
            </Card>
            <Card
              style={{
                flex: 1,
                padding: spacing.base,
                alignItems: "center",
                backgroundColor: "#fee2e2",
              }}
            >
              <Text style={[type.h3, { color: "#dc2626" }]}>{stats.status_breakdown.alert}</Text>
              <Text style={[type.bodySmall, { color: "#dc2626", marginTop: spacing.sm }]}>Alert</Text>
            </Card>
          </View>
        </Animated.View>

        {/* High earners alert */}
        {stats.high_earners.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: spacing.lg }}>
            <Card style={{ padding: spacing.base, backgroundColor: "#fee2e2", borderLeftWidth: 4, borderLeftColor: "#dc2626" }}>
              <View style={{ flexDirection: "row", gap: spacing.base, alignItems: "flex-start" }}>
                <AlertCircle size={24} color="#dc2626" />
                <View style={{ flex: 1 }}>
                  <Text style={[type.bodySemiBold, { color: "#7f1d1d", marginBottom: spacing.xs }]}>
                    High Earners ({stats.high_earners.length})
                  </Text>
                  <Text style={[type.bodySmall, { color: "#991b1b" }]}>
                    {stats.high_earners.length} worker{stats.high_earners.length !== 1 ? "s" : ""} earning £100k+
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Worker list */}
        {workers.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
              Worker Breakdown
            </Text>
            <FlatList
              scrollEnabled={false}
              data={workers}
              keyExtractor={(item) => item.worker_id}
              ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
              renderItem={({ item }) => (
                <Card
                  style={{
                    padding: spacing.base,
                    backgroundColor:
                      item.compliance_status === "ok"
                        ? colors.accent.surface
                        : item.compliance_status === "warning"
                          ? colors.primary.surface
                          : "#fee2e2",
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                      {item.worker_id.slice(0, 8)}...
                    </Text>
                    <Badge
                      label={item.compliance_status}
                      variant={
                        item.compliance_status === "ok"
                          ? "success"
                          : item.compliance_status === "warning"
                            ? "warning"
                            : "error"
                      }
                    />
                  </View>
                  <View style={{ flexDirection: "row", gap: spacing.lg }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Gross</Text>
                      <Text style={[type.bodySemiBold, { color: colors.slate[900], marginTop: spacing.xs }]}>
                        {formatCurrency(item.total_gross)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Tax (est.)</Text>
                      <Text style={[type.bodySemiBold, { color: colors.slate[700], marginTop: spacing.xs }]}>
                        {formatCurrency(item.estimated_tax)}
                      </Text>
                    </View>
                  </View>
                </Card>
              )}
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
