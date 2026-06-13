import { useEffect, useState } from "react";
import { ScrollView, View, Text, FlatList, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { CheckCircle, AlertCircle } from "lucide-react-native";
import { Card, ScreenHeader, Button, Badge } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface Payslip {
  id: string;
  worker_id: string;
  worker_type: string;
  status: string;
  gross_earnings: number;
  net_pay: number;
  pay_runs: { reference: string };
}

export default function BulkActionsScreen() {
  const router = useRouter();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"mark_paid" | "send_notifications" | "add_adjustment">(
    "mark_paid"
  );
  const [adjustmentData, setAdjustmentData] = useState({
    type: "bonus",
    amount: "",
    description: "",
  });
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const response = await apiFetch(`/api/admin/payslips?status=${statusFilter}`);
        const data = await response.json();
        if (data.success) {
          setPayslips(data.payslips || []);
        }
      } catch (e) {
        console.error("Failed to fetch payslips:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslips();
  }, [statusFilter]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
    Haptics.selectionAsync().catch(() => {});
  };

  const selectAll = () => {
    if (selected.size === payslips.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(payslips.map((p) => p.id)));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleBulkAction = async () => {
    if (selected.size === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setMessage("Please select at least one payslip");
      return;
    }

    setProcessing(true);
    setMessage("");

    try {
      const body: any = {
        payslip_ids: Array.from(selected),
        action,
      };

      if (action === "add_adjustment") {
        if (!adjustmentData.amount || !adjustmentData.description) {
          setMessage("Please fill in amount and description");
          setProcessing(false);
          return;
        }
        body.data = {
          type: adjustmentData.type,
          amount: parseInt(adjustmentData.amount) * 100,
          description: adjustmentData.description,
        };
      }

      const response = await apiFetch("/api/admin/payslips/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setMessage(`✅ ${data.message}`);
        setSelected(new Set());
        const refreshResponse = await apiFetch(`/api/admin/payslips?status=${statusFilter}`);
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setPayslips(refreshData.payslips || []);
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setMessage(`❌ ${data.error}`);
      }
    } catch (e) {
      setMessage(`❌ Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setProcessing(false);
    }
  };

  const selectedTotal = payslips
    .filter((p) => selected.has(p.id))
    .reduce((sum, p) => sum + p.net_pay, 0);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="Bulk Actions" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[type.body, { color: colors.slate[600] }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Bulk Actions" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Status filter */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.sm }]}>
            Filter Status
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {["pending", "draft", "paid"].map((s) => (
              <Pressable
                key={s}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setStatusFilter(s);
                  setSelected(new Set());
                }}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.base,
                  borderRadius: 8,
                  backgroundColor:
                    statusFilter === s ? colors.primary.DEFAULT : colors.slate[200],
                }}
              >
                <Text
                  style={[
                    type.bodySemiBold,
                    {
                      color: statusFilter === s ? colors.white : colors.slate[700],
                      textAlign: "center",
                    },
                  ]}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Action selector */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            Select Action
          </Text>
          {[
            { value: "mark_paid", label: "Mark as Paid" },
            { value: "send_notifications", label: "Send Notifications" },
            { value: "add_adjustment", label: "Add Adjustment" },
          ].map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setAction(opt.value as any);
              }}
              style={{
                paddingVertical: spacing.base,
                paddingHorizontal: spacing.base,
                borderRadius: 8,
                backgroundColor: action === opt.value ? colors.primary.surface : colors.slate[100],
                marginBottom: spacing.sm,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: action === opt.value ? colors.primary.DEFAULT : colors.slate[400],
                  backgroundColor:
                    action === opt.value ? colors.primary.DEFAULT : "transparent",
                  marginRight: spacing.base,
                }}
              />
              <Text
                style={[
                  type.body,
                  {
                    color: action === opt.value ? colors.primary.DEFAULT : colors.slate[700],
                  },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Adjustment details */}
        {action === "add_adjustment" && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: spacing.lg }}>
            <Card style={{ padding: spacing.base, backgroundColor: colors.primary.surface }}>
              <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT, marginBottom: spacing.base }]}>
                Adjustment Details
              </Text>
              <View style={{ gap: spacing.base }}>
                <View>
                  <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.xs }]}>
                    Type
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: spacing.sm,
                    }}
                  >
                    {["bonus", "deduction"].map((t) => (
                      <Pressable
                        key={t}
                        onPress={() =>
                          setAdjustmentData({ ...adjustmentData, type: t })
                        }
                        style={{
                          flex: 1,
                          paddingVertical: spacing.sm,
                          borderRadius: 6,
                          backgroundColor:
                            adjustmentData.type === t
                              ? colors.primary.DEFAULT
                              : colors.slate[200],
                        }}
                      >
                        <Text
                          style={[
                            type.bodySmall,
                            {
                              color:
                                adjustmentData.type === t
                                  ? colors.white
                                  : colors.slate[700],
                              textAlign: "center",
                              fontWeight: "600",
                            },
                          ]}
                        >
                          {t}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View>
                  <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.xs }]}>
                    Amount (£)
                  </Text>
                  <TextInput
                    value={adjustmentData.amount}
                    onChangeText={(text) =>
                      setAdjustmentData({ ...adjustmentData, amount: text })
                    }
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={{
                      backgroundColor: colors.white,
                      borderRadius: 8,
                      paddingHorizontal: spacing.base,
                      paddingVertical: spacing.sm,
                      color: colors.slate[900],
                    }}
                  />
                </View>
                <View>
                  <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.xs }]}>
                    Description
                  </Text>
                  <TextInput
                    value={adjustmentData.description}
                    onChangeText={(text) =>
                      setAdjustmentData({ ...adjustmentData, description: text })
                    }
                    placeholder="e.g., Christmas bonus"
                    style={{
                      backgroundColor: colors.white,
                      borderRadius: 8,
                      paddingHorizontal: spacing.base,
                      paddingVertical: spacing.sm,
                      color: colors.slate[900],
                    }}
                  />
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Summary */}
        {selected.size > 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginBottom: spacing.lg }}>
            <Card
              style={{
                padding: spacing.base,
                backgroundColor: colors.accent.surface,
              }}
            >
              <Text style={[type.bodySmall, { color: colors.accent.DEFAULT, marginBottom: spacing.xs }]}>
                Selection Summary
              </Text>
              <Text style={[type.h3, { color: colors.accent.DEFAULT }]}>
                {selected.size} selected
              </Text>
              <Text style={[type.bodySmall, { color: colors.accent.light, marginTop: spacing.xs }]}>
                Total: {formatCurrency(selectedTotal)}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Payslips list */}
        <Animated.View entering={FadeInDown.delay(250).springify()} style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.base }}>
            <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
              Payslips ({payslips.length})
            </Text>
            <Pressable
              onPress={selectAll}
              style={{
                paddingHorizontal: spacing.base,
                paddingVertical: spacing.xs,
                borderRadius: 6,
                backgroundColor: colors.slate[100],
              }}
            >
              <Text style={[type.bodySmall, { color: colors.slate[700], fontWeight: "600" }]}>
                {selected.size === payslips.length ? "Deselect All" : "Select All"}
              </Text>
            </Pressable>
          </View>

          <FlatList
            scrollEnabled={false}
            data={payslips}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item }) => (
              <Pressable onPress={() => toggleSelect(item.id)}>
                <Card
                  style={{
                    padding: spacing.base,
                    backgroundColor: selected.has(item.id)
                      ? colors.primary.surface
                      : colors.white,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: selected.has(item.id)
                        ? colors.primary.DEFAULT
                        : colors.slate[300],
                      backgroundColor: selected.has(item.id)
                        ? colors.primary.DEFAULT
                        : "transparent",
                      marginRight: spacing.base,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected.has(item.id) && (
                      <CheckCircle size={16} color={colors.white} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                      {item.pay_runs.reference}
                    </Text>
                    <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                      {formatCurrency(item.net_pay)}
                    </Text>
                  </View>
                  <Badge label={item.status} variant="default" />
                </Card>
              </Pressable>
            )}
          />
        </Animated.View>

        {/* Action button */}
        <Button
          label={`Execute Action (${selected.size})`}
          onPress={handleBulkAction}
          loading={processing}
          disabled={selected.size === 0}
          variant="primary"
        />

        {/* Message */}
        {message && (
          <Animated.View
            entering={FadeInDown.springify()}
            style={{
              marginTop: spacing.lg,
              padding: spacing.base,
              borderRadius: 12,
              backgroundColor: message.startsWith("✅")
                ? colors.accent.surface
                : "#fee2e2",
            }}
          >
            <Text
              style={[
                type.body,
                {
                  color: message.startsWith("✅")
                    ? colors.accent.DEFAULT
                    : "#dc2626",
                },
              ]}
            >
              {message}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
