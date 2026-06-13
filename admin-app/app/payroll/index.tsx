import { useState, useMemo } from "react";
import { ScrollView, View, Text, Pressable, RefreshControl, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { Plus, Search } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, Badge, Skeleton, ErrorState, EmptyState, Button, Input } from "@/components/ui";
import { usePayRuns } from "@/hooks/usePayRuns";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing, radius } from "@/lib/tokens";

type SortBy = "date" | "status" | "workers";

export default function PayrollScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = usePayRuns();
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"active" | "archived">("active");

  const runs = data?.data ?? [];
  const archivedCount = useMemo(() => runs.filter((r) => r.archived_at).length, [runs]);

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const copy = runs.filter((r) => {
      const isArchived = !!r.archived_at;
      if (view === "active" ? isArchived : !isArchived) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q && !r.reference.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sortBy === "date") copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === "status") copy.sort((a, b) => a.status.localeCompare(b.status));
    else if (sortBy === "workers") copy.sort((a, b) => (b.payslips?.length ?? 0) - (a.payslips?.length ?? 0));
    return copy;
  }, [runs, sortBy, search, statusFilter, view]);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["payRuns"] });
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} style={{ marginBottom: spacing.base, height: 120, borderRadius: radius.lg }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.base }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={colors.primary.DEFAULT} />}
        >
          <ErrorState message="Failed to load pay runs" onRetry={refresh} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.base }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={colors.primary.DEFAULT} />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.xl }}>
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[type.h2, { color: colors.slate[900], marginBottom: spacing.sm }]}>Payroll</Text>
            <Text style={[type.body, { color: colors.slate[600] }]}>Manage pay runs and worker payslips</Text>
          </View>

          <Button
            label="New pay run"
            variant="primary"
            size="md"
            icon={<Plus size={20} color={colors.white} strokeWidth={2.5} />}
            onPress={() => router.push("/payroll-new")}
          />
        </Animated.View>

        {/* Active / Archived */}
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
          {(["active", "archived"] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setView(v);
              }}
              style={{
                paddingHorizontal: spacing.base,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: view === v ? colors.slate[900] : colors.white,
                borderWidth: 1,
                borderColor: view === v ? colors.slate[900] : colors.slate[200],
              }}
            >
              <Text
                style={[
                  type.bodySmall,
                  { color: view === v ? colors.white : colors.slate[700], fontWeight: "600", textTransform: "capitalize" },
                ]}
              >
                {v}
                {v === "archived" && archivedCount > 0 ? ` (${archivedCount})` : ""}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Search */}
        <View style={{ marginBottom: spacing.md, position: "relative" }}>
          <View style={{ position: "absolute", left: 12, top: 14, zIndex: 1 }}>
            <Search size={18} color={colors.slate[400]} />
          </View>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search reference"
            autoCapitalize="characters"
            style={{ paddingLeft: 40 }}
          />
        </View>

        {/* Status filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.md }}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {(["all", "draft", "finalised", "paid", "cancelled"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setStatusFilter(s);
              }}
              style={{
                paddingHorizontal: spacing.base,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                backgroundColor: statusFilter === s ? colors.accent.DEFAULT : colors.white,
                borderWidth: 1,
                borderColor: statusFilter === s ? colors.accent.DEFAULT : colors.slate[200],
              }}
            >
              <Text
                style={[
                  type.bodySmall,
                  {
                    color: statusFilter === s ? colors.white : colors.slate[700],
                    fontWeight: "600",
                    textTransform: "capitalize",
                  },
                ]}
              >
                {s === "all" ? "All" : s}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Sort tabs */}
        <View style={{ marginBottom: spacing.lg, flexDirection: "row", gap: spacing.md }}>
          {(["date", "status", "workers"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setSortBy(s);
              }}
              style={{
                paddingHorizontal: spacing.base,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                backgroundColor: sortBy === s ? colors.primary.DEFAULT : colors.white,
                borderWidth: 1,
                borderColor: sortBy === s ? colors.primary.DEFAULT : colors.slate[200],
              }}
            >
              <Text
                style={[
                  type.body,
                  {
                    color: sortBy === s ? colors.white : colors.slate[700],
                    fontWeight: "600",
                    textTransform: "capitalize",
                  },
                ]}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Runs list */}
        {sorted.length === 0 ? (
          <EmptyState
            title={runs.length === 0 ? "No pay runs" : "No matches"}
            message={
              runs.length === 0
                ? "No pay runs yet. Create one to get started."
                : "No pay runs match your search or filter."
            }
          />
        ) : (
          <FlatList
            scrollEnabled={false}
            data={sorted}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item: run }) => (
              <Animated.View entering={FadeInDown.springify()} layout={Layout.springify()}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    router.push(`/payroll/${run.id}`);
                  }}
                >
                  <Card style={{ padding: spacing.base }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ marginBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                          <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{run.reference}</Text>
                          <Badge
                            label={run.status.replace(/_/g, " ")}
                            variant={
                              run.status === "draft"
                                ? "default"
                                : run.status === "paid"
                                  ? "success"
                                  : "default"
                            }
                          />
                        </View>
                        <Text style={[type.bodySmall, { color: colors.slate[600] }]}>
                          {new Date(run.period_start).toLocaleDateString("en-GB")} –{" "}
                          {new Date(run.period_end).toLocaleDateString("en-GB")}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end", justifyContent: "center", minWidth: 60 }}>
                        <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                          {run.payslips?.length ?? 0}
                        </Text>
                        <Text style={[type.bodySmall, { color: colors.slate[600] }]}>
                          {(run.payslips?.length ?? 0) === 1 ? "worker" : "workers"}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </Animated.View>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
