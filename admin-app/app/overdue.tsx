import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PackageCheck, AlertTriangle } from "lucide-react-native";
import { LargeHeader } from "@/components/shared/LargeHeader";
import { Card, Badge, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useOverdue } from "@/hooks/useOps";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";

export default function OverdueScreen() {
  const list = useOverdue();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <LargeHeader title="Items Still Out" />
      <ScrollView contentContainerClassName="px-4 pb-12">
        {list.isLoading ? (
          <Skeleton style={{ height: 90, borderRadius: 16 }} />
        ) : list.isError ? (
          <ErrorState message={(list.error as Error)?.message} />
        ) : (list.data?.length ?? 0) === 0 ? (
          <EmptyState title="All delivered" message="No jobs are past their date without being completed." icon={<PackageCheck size={48} color={colors.primary.lighter} />} />
        ) : (
          (list.data ?? []).map((j) => (
            <Card key={j.id} style={{ marginBottom: 10 }}>
              <View className="flex-row items-center justify-between">
                <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{j.customer?.full_name ?? "Customer"}</Text>
                <Badge label={`${j.days_overdue}d overdue`} colour="#b91c1c" />
              </View>
              <Text style={[type.mono, { color: colors.slate[400], marginTop: 2 }]}>{j.reference}</Text>
              <View className="flex-row items-center gap-1.5 mt-2">
                <AlertTriangle size={14} color="#d97706" />
                <Text style={[type.bodySmall, { color: colors.slate[600] }]}>{j.stage}</Text>
              </View>
              <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 4 }]}>
                {j.origin?.postcode ?? "—"}{j.destination?.postcode ? ` → ${j.destination.postcode}` : ""}
                {j.drivers.length ? ` · ${j.drivers.join(", ")}` : ""}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
