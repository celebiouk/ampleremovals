import { useState } from "react";
import { ScrollView, View, Text, Pressable, Alert, RefreshControl, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { ArrowLeft, Download, CheckCheck } from "lucide-react-native";
import { Card, Badge, Skeleton, ErrorState } from "@/components/ui";
import { usePayslip } from "@/hooks/usePayslip";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function PayslipDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const qc = useQueryClient();
  const payslipId = id as string;

  const { data, isLoading, isError, refetch, isRefetching } = usePayslip(payslipId);
  const [paying, setPaying] = useState(false);

  const payslip = data?.payslip;

  function refresh() {
    qc.invalidateQueries({ queryKey: ["payslip", payslipId] });
  }

  async function markPaid() {
    Alert.alert("Mark as paid?", "This will update the linked earnings.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark paid",
        style: "default",
        onPress: async () => {
          setPaying(true);
          try {
            await apiFetch(`/api/admin/payslips/${payslipId}/pay`, {
              method: "PATCH",
              body: JSON.stringify({ paymentMethod: "bank_transfer" }),
            });
            refresh();
            Alert.alert("Success", "Payslip marked as paid");
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Failed to mark paid");
          } finally {
            setPaying(false);
          }
        },
      },
    ]);
  }

  async function viewPDF() {
    try {
      const url = `/api/admin/payslips/${payslipId}/pdf`;
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Error", "Could not open PDF");
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <ScrollView className="flex-1 px-4 py-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="mb-4 h-20 rounded-lg" />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !payslip) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <ScrollView
          className="flex-1 px-4 py-6"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} />}
        >
          <ErrorState message="Failed to load payslip" onRetry={refresh} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1 px-4 py-6"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} />}
      >
        {/* Header */}
        <View className="mb-6">
          <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center gap-2">
            <ArrowLeft size={20} color="#9ca3af" />
            <Text className="text-sm font-medium text-slate-600">Back</Text>
          </Pressable>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-slate-900">Payslip</Text>
              <Text className="mt-1 text-sm text-slate-600">
                {payslip.worker_type === "driver" ? "Driver" : "Cleaner"}
              </Text>
            </View>
            <Badge
              label={payslip.status}
              className={payslip.status === "paid"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"}
            />
          </View>
        </View>

        {/* Totals */}
        <Card className="mb-6 p-4">
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-600">Gross Earnings</Text>
              <Text className="font-semibold text-slate-900">
                {formatCurrency(payslip.gross_earnings)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-600">Tips</Text>
              <Text className="font-semibold text-slate-900">
                {formatCurrency(payslip.tips_total)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-600">Adjustments</Text>
              <Text className="font-semibold text-slate-900">
                {formatCurrency(payslip.adjustments_total)}
              </Text>
            </View>
            <View className="border-t border-slate-200 pt-3 flex-row items-center justify-between">
              <Text className="font-semibold text-slate-900">Net Pay</Text>
              <Text className="text-lg font-bold text-purple-600">
                {formatCurrency(payslip.net_pay)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <View className="mb-6 gap-2">
          <Pressable
            onPress={viewPDF}
            className="flex-row items-center justify-center gap-2 rounded-lg bg-white px-4 py-3"
          >
            <Download size={18} color="#7c3aed" />
            <Text className="font-medium text-purple-600">View PDF</Text>
          </Pressable>
          {payslip.status === "pending" && (
            <Pressable
              onPress={markPaid}
              disabled={paying}
              className={`flex-row items-center justify-center gap-2 rounded-lg px-4 py-3 ${
                paying ? "bg-slate-200" : "bg-green-600"
              }`}
            >
              <CheckCheck size={18} color={paying ? "#999" : "white"} />
              <Text className={`font-medium ${paying ? "text-slate-500" : "text-white"}`}>
                {paying ? "Processing..." : "Mark as Paid"}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Adjustments */}
        {payslip.payroll_adjustments && payslip.payroll_adjustments.length > 0 && (
          <View className="mb-6">
            <Text className="mb-3 text-lg font-bold text-slate-900">Adjustments</Text>
            <FlatList
              scrollEnabled={false}
              data={payslip.payroll_adjustments}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View className="h-2" />}
              renderItem={({ item: adj }) => (
                <Card className="flex-row items-center justify-between p-4">
                  <View>
                    <Text className="font-medium text-slate-900">{adj.label}</Text>
                    <Text className="text-xs text-slate-600 capitalize">{adj.type}</Text>
                  </View>
                  <Text className={`font-semibold ${adj.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {adj.amount >= 0 ? "+" : ""}{formatCurrency(adj.amount)}
                  </Text>
                </Card>
              )}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
