import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Lightbulb, TrendingUp } from "lucide-react-native";
import { Card } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface Row { key: string; total: number; won: number; lost: number; conversion: number; value: number }
interface Insights {
  overall: { total: number; won: number; lost: number; conversion: number; value: number; avgLeadScore: number | null };
  bySource: Row[]; byDay: Row[]; byService: Row[]; headlines: string[];
}

function convColor(c: number) { return c >= 50 ? { bg: "#dcfce7", t: "#15803d" } : c >= 25 ? { bg: "#fef3c7", t: "#92400e" } : { bg: "#f1f5f9", t: "#64748b" }; }

function Table({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <Card>
      <Text className="mb-2 text-base font-semibold text-slate-900 dark:text-white">{title}</Text>
      {rows.length === 0 ? (
        <Text className="text-sm text-slate-400">Not enough data yet.</Text>
      ) : (
        <View className="gap-1.5">
          {rows.map((r) => {
            const c = convColor(r.conversion);
            return (
              <View key={r.key} className="flex-row items-center justify-between border-t border-slate-100 py-1.5">
                <Text className="flex-1 capitalize text-sm text-slate-700 dark:text-slate-300" numberOfLines={1}>{r.key}</Text>
                <Text className="w-12 text-right text-sm text-slate-500">{r.won}/{r.total}</Text>
                <View style={{ backgroundColor: c.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                  <Text style={{ color: c.t, fontSize: 11, fontWeight: "700" }}>{r.conversion}%</Text>
                </View>
                <Text className="ml-2 w-20 text-right text-sm font-medium text-slate-700 dark:text-slate-200">{formatCurrency(r.value)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

/** Insights — lead conversion by source / day / service. Mirrors the web page. */
export default function InsightsScreen() {
  const router = useRouter();
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/insights");
      const json = await res.json();
      if (json.success) setData(json);
    } catch { /* non-fatal */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const o = data?.overall;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 font-display text-2xl text-slate-900">Insights</Text>
      </View>

      {loading ? (
        <View className="items-center py-10"><ActivityIndicator color="#7e22ce" /></View>
      ) : !data ? (
        <View className="items-center py-10"><Text className="text-sm text-slate-400">Couldn&apos;t load insights.</Text></View>
      ) : (
        <ScrollView contentContainerClassName="p-4 gap-3 pb-12">
          {/* Overall */}
          <View className="flex-row gap-3">
            <Card className="flex-1">
              <Text className="text-xs font-medium uppercase text-slate-400">Conversion</Text>
              <Text className="mt-1 font-display text-2xl font-bold text-brand-purple-700">{o?.conversion ?? 0}%</Text>
              <Text className="text-xs text-slate-500">{o?.won ?? 0} won of {o?.total ?? 0}</Text>
            </Card>
            <Card className="flex-1">
              <Text className="text-xs font-medium uppercase text-slate-400">Won value</Text>
              <Text className="mt-1 font-display text-2xl font-bold text-brand-green-600">{formatCurrency(o?.value ?? 0)}</Text>
              {o?.avgLeadScore != null ? <Text className="text-xs text-slate-500">avg lead score {o.avgLeadScore}</Text> : null}
            </Card>
          </View>

          {/* Headlines */}
          {data.headlines?.length ? (
            <Card className="border-amber-200 bg-amber-50">
              <View className="flex-row items-center gap-1.5"><Lightbulb size={16} color="#d97706" /><Text className="text-sm font-bold text-amber-900">Headlines</Text></View>
              <View className="mt-2 gap-1.5">
                {data.headlines.map((h, i) => (
                  <View key={i} className="flex-row gap-2"><TrendingUp size={14} color="#d97706" /><Text className="flex-1 text-sm text-amber-900">{h}</Text></View>
                ))}
              </View>
            </Card>
          ) : null}

          <Table title="By service" rows={data.byService} />
          <Table title="By source" rows={data.bySource} />
          <Table title="By day" rows={data.byDay} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
