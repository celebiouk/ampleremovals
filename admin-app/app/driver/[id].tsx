import { useState } from "react";
import { ScrollView, View, Text, Pressable, Alert, Linking, RefreshControl, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, CheckCircle2, AlertCircle, PoundSterling, Truck } from "lucide-react-native";
import { Card, Button, Badge, Skeleton, ErrorState } from "@/components/ui";
import { useDriverDetail, useDriverDocuments, isPending } from "@/hooks/useDrivers";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DRIVER_STATUS_LABELS, DRIVER_STATUS_COLOURS } from "@/lib/constants";

export default function DriverProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useDriverDetail(id!);
  const { data: docs } = useDriverDocuments(id!);
  const [approving, setApproving] = useState(false);

  const driver = data?.driver;
  const pending = driver ? isPending(driver) : false;

  async function quickApprove() {
    setApproving(true);
    try {
      await apiFetch(`/api/admin/drivers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "active", default_pay_percentage: 40 }),
      });
      qc.invalidateQueries({ queryKey: ["driver", id] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setApproving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 text-xl font-bold text-slate-900 dark:text-white" numberOfLines={1}>
          {driver ? `${driver.first_name} ${driver.last_name}` : "Driver"}
        </Text>
        {driver ? (
          <Pressable onPress={() => router.push(`/driver/${id}/edit`)} className="flex-row items-center gap-1 p-1">
            <Pencil size={16} color="#7e22ce" /><Text className="text-sm font-medium text-brand-purple-700">Edit</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View className="gap-4 p-5"><Skeleton className="h-28" /><Skeleton className="h-36" /></View>
      ) : isError || !driver ? (
        <ErrorState message="Couldn't load this driver." onRetry={refetch} />
      ) : (
        <ScrollView
          contentContainerClassName="p-5 gap-4 pb-12"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {/* Pending banner */}
          {pending ? (
            <View className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <View className="mb-2 flex-row items-center gap-2">
                <AlertCircle size={20} color="#d97706" />
                <Text className="font-bold text-amber-800 dark:text-amber-400">Pending approval</Text>
              </View>
              <Text className="mb-3 text-sm text-amber-700 dark:text-amber-300">
                This driver self-registered. Approve to activate (sets 40% pay), or edit for custom settings.
              </Text>
              <Button label="Quick approve (40% pay, active)" variant="secondary" loading={approving} onPress={quickApprove} />
            </View>
          ) : null}

          {/* Profile */}
          <Card>
            <View className="flex-row items-center gap-3">
              {docs?.documents?.["profile-photo"] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <Image source={{ uri: docs.documents["profile-photo"] }} className="h-16 w-16 rounded-full" />
              ) : (
                <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-purple-100">
                  <Text className="text-xl font-bold text-brand-purple-700">{driver.first_name?.[0]}{driver.last_name?.[0]}</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-lg font-bold text-slate-900 dark:text-white">{driver.first_name} {driver.last_name}</Text>
                {driver.preferred_name ? <Text className="text-sm text-slate-500">Prefers: {driver.preferred_name}</Text> : null}
                <View className="mt-1">
                  {pending ? <Badge label="Pending Approval" colour="bg-amber-100 text-amber-700" /> : <Badge label={DRIVER_STATUS_LABELS[driver.status]} colour={DRIVER_STATUS_COLOURS[driver.status]} />}
                </View>
              </View>
            </View>
            <View className="mt-4 flex-row flex-wrap gap-2">
              {driver.phone ? <Button label="Call" variant="outline" size="sm" onPress={() => Linking.openURL(`tel:${driver.phone}`)} /> : null}
              {driver.email ? <Button label="Email" variant="outline" size="sm" onPress={() => Linking.openURL(`mailto:${driver.email}`)} /> : null}
            </View>
          </Card>

          {/* Stats */}
          <View className="flex-row gap-4">
            <Card className="flex-1">
              <View className="mb-1 flex-row items-center gap-2"><Truck size={16} color="#7e22ce" /><Text className="text-xs font-medium uppercase text-slate-500">Jobs</Text></View>
              <Text className="text-2xl font-bold text-slate-900 dark:text-white">{driver.job_count}</Text>
            </Card>
            <Card className="flex-1">
              <View className="mb-1 flex-row items-center gap-2"><PoundSterling size={16} color="#16a34a" /><Text className="text-xs font-medium uppercase text-slate-500">Pay rate</Text></View>
              <Text className="text-2xl font-bold text-slate-900 dark:text-white">{driver.default_pay_percentage}%</Text>
            </Card>
          </View>

          {/* Earnings summary */}
          <Card>
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Earnings</Text>
            <Row label="Total" value={formatCurrency(driver.earnings_summary.total)} bold />
            <Row label="Pending" value={formatCurrency(driver.earnings_summary.pending)} />
            <Row label="Approved" value={formatCurrency(driver.earnings_summary.approved)} />
            <Row label="Paid out" value={formatCurrency(driver.earnings_summary.paid)} />
          </Card>

          {/* Details */}
          <Card>
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Details</Text>
            <Row label="Email" value={driver.email} />
            <Row label="Phone" value={driver.phone} />
            {driver.date_of_birth ? <Row label="DOB" value={formatDate(driver.date_of_birth)} /> : null}
          </Card>

          {/* Documents */}
          <Card>
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Documents</Text>
            <DocRow label="Driving licence (front)" uri={docs?.documents?.["licence-front"] ?? null} />
            <DocRow label="Driving licence (back)" uri={docs?.documents?.["licence-back"] ?? null} />
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-sm text-slate-500 dark:text-slate-400">{label}</Text>
      <Text className={`text-sm ${bold ? "font-bold" : "font-medium"} text-slate-900 dark:text-white`}>{value}</Text>
    </View>
  );
}

function DocRow({ label, uri }: { label: string; uri: string | null }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm text-slate-700 dark:text-slate-300">{label}</Text>
      {uri ? (
        <Pressable onPress={() => Linking.openURL(uri)}><Text className="text-sm font-medium text-brand-purple-700">View</Text></Pressable>
      ) : (
        <Text className="text-sm text-slate-400">Not uploaded</Text>
      )}
    </View>
  );
}
