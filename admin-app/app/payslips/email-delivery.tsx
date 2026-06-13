import { useEffect, useState } from "react";
import { ScrollView, View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Mail, CheckCircle2 } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface EmailHistory {
  id: string;
  date: string;
  payslip_reference: string;
  status: string;
}

export default function EmailDeliveryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<EmailHistory[]>([]);
  const [workerEmail, setWorkerEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiFetch("/api/worker/payslips/email-history");
        const data = await response.json();

        if (data.success) {
          setHistory(data.email_history.emails);
          setWorkerEmail(data.email_history.worker_email);
        }
      } catch (e) {
        console.error("Failed to fetch email history:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} style={{ marginBottom: spacing.base, height: 80, borderRadius: 16 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Email Delivery" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Email info */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Card style={{ padding: spacing.base, backgroundColor: colors.primary.surface }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.base, marginBottom: spacing.base }}>
              <Mail size={24} color={colors.primary.DEFAULT} />
              <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT }]}>
                Email Settings
              </Text>
            </View>
            <Text style={[type.bodySmall, { color: colors.slate[600] }]}>
              Payslips will be sent to:
            </Text>
            <Text style={[type.bodySemiBold, { color: colors.slate[900], marginTop: spacing.sm }]}>
              {workerEmail}
            </Text>
          </Card>
        </Animated.View>

        {/* Email history */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            Recent Emails ({history.length})
          </Text>

          {history.length === 0 ? (
            <Card style={{ padding: spacing.lg, alignItems: "center" }}>
              <Mail size={40} color={colors.slate[300]} />
              <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.base, textAlign: "center" }]}>
                No payslips emailed yet
              </Text>
            </Card>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={history}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
              renderItem={({ item }) => (
                <Card style={{ padding: spacing.base, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                      {item.payslip_reference}
                    </Text>
                    <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                      {new Date(item.date).toLocaleDateString("en-GB")}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                    <CheckCircle2 size={20} color={colors.accent.DEFAULT} />
                    <Text style={[type.bodySmall, { color: colors.accent.DEFAULT, fontWeight: "600" }]}>
                      Sent
                    </Text>
                  </View>
                </Card>
              )}
            />
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
