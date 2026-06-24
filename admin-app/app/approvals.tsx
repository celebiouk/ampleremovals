import { useState } from "react";
import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCheck } from "lucide-react-native";
import { LargeHeader } from "@/components/shared/LargeHeader";
import { Card, Button, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useApprovalList, useApprove } from "@/hooks/useOps";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";

const TABS = [
  { kind: "job-extras" as const, label: "Extras" },
  { kind: "expenses" as const, label: "Expenses" },
  { kind: "leave-requests" as const, label: "Time off" },
];
type Kind = (typeof TABS)[number]["kind"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function driverName(d: any): string {
  return d ? (d.preferred_name || [d.first_name, d.last_name].filter(Boolean).join(" ")) : "";
}
function title(kind: Kind, item: any): string {
  if (kind === "job-extras") return `£${Number(item.amount).toFixed(2)} · ${item.description}`;
  if (kind === "expenses") return `£${Number(item.amount).toFixed(2)} · ${item.category}`;
  return `${item.start_date}${item.end_date && item.end_date !== item.start_date ? ` – ${item.end_date}` : ""}`;
}
function sub(kind: Kind, item: any): string {
  const d = driverName(item.driver);
  if (kind === "job-extras") return [d, item.booking?.reference].filter(Boolean).join(" · ");
  if (kind === "expenses") return [d, item.note].filter(Boolean).join(" · ");
  return [d, item.reason].filter(Boolean).join(" · ");
}

export default function ApprovalsScreen() {
  const [tab, setTab] = useState<Kind>("job-extras");
  const list = useApprovalList(tab);
  const approve = useApprove(tab);

  async function act(id: string, status: "approved" | "rejected") {
    try {
      await approve.mutateAsync({ id, status });
    } catch (e) {
      Alert.alert("Couldn't update", (e as Error)?.message ?? "Try again");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <LargeHeader title="Approvals" />
      <View className="flex-row gap-2 px-4 mb-2">
        {TABS.map((t) => (
          <Pressable
            key={t.kind}
            onPress={() => setTab(t.kind)}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: tab === t.kind ? colors.primary.DEFAULT : colors.slate[100] }}
          >
            <Text style={{ color: tab === t.kind ? "#fff" : colors.slate[600], fontFamily: type.bodySemiBold.fontFamily, fontSize: 13 }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerClassName="px-4 pb-12">
        {list.isLoading ? (
          <Skeleton style={{ height: 80, borderRadius: 16 }} />
        ) : list.isError ? (
          <ErrorState message={(list.error as Error)?.message} />
        ) : (list.data?.length ?? 0) === 0 ? (
          <EmptyState title="Nothing pending" message="Approved or rejected items don't show here." icon={<CheckCheck size={48} color={colors.primary.lighter} />} />
        ) : (
          (list.data ?? []).map((item: any) => (
            <Card key={item.id} style={{ marginBottom: 10 }}>
              <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{title(tab, item)}</Text>
              {sub(tab, item) ? <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 2 }]}>{sub(tab, item)}</Text> : null}
              <View className="flex-row gap-2 mt-3">
                <View className="flex-1"><Button label="Approve" variant="accent" loading={approve.isPending} onPress={() => act(item.id, "approved")} /></View>
                <View className="flex-1"><Button label="Reject" variant="outline" onPress={() => act(item.id, "rejected")} /></View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
